import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock, MessageParam, Tool, ToolUseBlockParam } from "@anthropic-ai/sdk/resources/messages";
import {
  AiCompletionRequest,
  AiCompletionResult,
  AiMessage,
  AiProvider,
  AiStreamChunk,
  AiToolCall,
  AiToolDefinition,
} from "./ai-provider.interface";
import { retryWithBackoff, withTimeout } from "./provider-http.util";

/**
 * Production Anthropic Claude provider, backed by the official
 * `@anthropic-ai/sdk`. Reads its API key from `AI_ANTHROPIC_API_KEY` at
 * request time only. Anthropic has no "system" or "tool" role in its
 * `messages` array — system prompts go in a top-level `system` field, and
 * tool results are sent back as a `user` message containing a
 * `tool_result` content block.
 */
@Injectable()
export class AnthropicProvider implements AiProvider {
  readonly key = "anthropic";
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.anthropicApiKey");
  }

  private getClient(): Anthropic {
    const apiKey = this.config.get<string>("ai.anthropicApiKey");
    if (!apiKey) {
      throw new Error(
        'The "anthropic" provider is not configured. Set AI_ANTHROPIC_API_KEY in the environment to enable it.',
      );
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey, maxRetries: 0 }); // we drive retries ourselves for consistent behavior across providers
    }
    return this.client;
  }

  private get model(): string {
    return this.config.get<string>("ai.anthropicModel") ?? "claude-sonnet-4-5";
  }

  private get timeoutMs(): number {
    return this.config.get<number>("ai.requestTimeoutMs") ?? 30_000;
  }

  private get maxRetries(): number {
    return this.config.get<number>("ai.maxRetries") ?? 2;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const client = this.getClient();
    const { system, messages } = toAnthropicMessages(request.messages);
    const tools = toAnthropicTools(request.tools);

    const response = await retryWithBackoff(
      () =>
        withTimeout(
          client.messages.create(
            {
              model: request.model ?? this.model,
              max_tokens: request.maxTokens ?? 1024,
              temperature: request.temperature,
              system,
              messages,
              tools,
            },
            { signal: request.signal },
          ),
          this.timeoutMs,
          "Anthropic messages.create",
        ),
      { maxAttempts: this.maxRetries + 1, signal: request.signal },
    ).catch((error) => {
      throw new Error(`Anthropic request failed: ${describeError(error)}`);
    });

    const textParts = response.content.filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text");
    const toolUseBlocks = response.content.filter(
      (block): block is Extract<typeof block, { type: "tool_use" }> => block.type === "tool_use",
    );

    if (toolUseBlocks.length > 0) {
      return {
        content: textParts.map((b) => b.text).join(""),
        toolCalls: toolUseBlocks.map((block) => ({
          id: block.id,
          name: block.name,
          arguments: (block.input as Record<string, unknown>) ?? {},
        })),
        finishReason: "tool_calls",
      };
    }

    return {
      content: textParts.map((b) => b.text).join(""),
      finishReason: response.stop_reason === "max_tokens" ? "length" : "stop",
    };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const client = this.getClient();
    const { system, messages } = toAnthropicMessages(request.messages);
    const tools = toAnthropicTools(request.tools);

    // Combine the caller's cancellation signal with a hard timeout so a
    // stalled upstream stream can't hang the request forever.
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = request.signal ? AbortSignal.any([request.signal, timeoutSignal]) : timeoutSignal;

    let anthropicStream: ReturnType<Anthropic["messages"]["stream"]>;
    try {
      anthropicStream = await retryWithBackoff(
        async () =>
          client.messages.stream(
            {
              model: request.model ?? this.model,
              max_tokens: request.maxTokens ?? 1024,
              temperature: request.temperature,
              system,
              messages,
              tools,
            },
            { signal: combinedSignal },
          ),
        { maxAttempts: this.maxRetries + 1, signal: request.signal },
      );
    } catch (error) {
      throw new Error(`Anthropic streaming request failed: ${describeError(error)}`);
    }

    let sawToolUse = false;
    let hitMaxTokens = false;

    try {
      for await (const event of anthropicStream) {
        if (request.signal?.aborted) return;

        if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
          sawToolUse = true;
        }

        if (event.type === "content_block_delta" && event.delta.type === "text_delta" && event.delta.text) {
          yield { delta: event.delta.text, done: false };
        }

        if (event.type === "message_delta" && event.delta.stop_reason === "max_tokens") {
          hitMaxTokens = true;
        }
      }
    } catch (error) {
      this.logger.error(`Anthropic stream interrupted: ${describeError(error)}`);
      throw new Error(`Anthropic streaming request failed: ${describeError(error)}`);
    }

    if (sawToolUse) {
      const finalMessage = await anthropicStream.finalMessage();
      const toolUseBlocks = finalMessage.content.filter(
        (block: ContentBlock): block is Extract<ContentBlock, { type: "tool_use" }> => block.type === "tool_use",
      );
      const toolCalls: AiToolCall[] = toolUseBlocks.map((block: Extract<ContentBlock, { type: "tool_use" }>) => ({
        id: block.id,
        name: block.name,
        arguments: (block.input as Record<string, unknown>) ?? {},
      }));
      yield { delta: "", done: true, toolCalls, finishReason: "tool_calls" };
    } else {
      yield { delta: "", done: true, finishReason: hitMaxTokens ? "length" : "stop" };
    }
  }
}

function toAnthropicTools(tools: AiToolDefinition[] | undefined): Tool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));
}

function toAnthropicMessages(messages: AiMessage[]): { system: string | undefined; messages: MessageParam[] } {
  const systemParts: string[] = [];
  const result: MessageParam[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }

    if (message.role === "tool") {
      result.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: message.toolCallId ?? "", content: message.content }],
      });
      continue;
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      const blocks: ToolUseBlockParam[] = message.toolCalls.map((call) => ({
        type: "tool_use",
        id: call.id,
        name: call.name,
        input: call.arguments,
      }));
      const content = message.content ? [{ type: "text" as const, text: message.content }, ...blocks] : blocks;
      result.push({ role: "assistant", content });
      continue;
    }

    result.push({ role: message.role === "assistant" ? "assistant" : "user", content: message.content });
  }

  return { system: systemParts.length ? systemParts.join("\n\n") : undefined, messages: result };
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}
