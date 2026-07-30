import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
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
 * Production OpenAI provider, backed by the official `openai` SDK's Chat
 * Completions API (function calling). Reads its API key from
 * `AI_OPENAI_API_KEY` at request time only.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly key = "openai";
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.openaiApiKey");
  }

  private getClient(): OpenAI {
    const apiKey = this.config.get<string>("ai.openaiApiKey");
    if (!apiKey) {
      throw new Error(
        'The "openai" provider is not configured. Set AI_OPENAI_API_KEY in the environment to enable it.',
      );
    }
    if (!this.client) {
      this.client = new OpenAI({ apiKey, maxRetries: 0 }); // we drive retries ourselves for consistent behavior across providers
    }
    return this.client;
  }

  private get model(): string {
    return this.config.get<string>("ai.openaiModel") ?? "gpt-4.1-mini";
  }

  private get timeoutMs(): number {
    return this.config.get<number>("ai.requestTimeoutMs") ?? 30_000;
  }

  private get maxRetries(): number {
    return this.config.get<number>("ai.maxRetries") ?? 2;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const client = this.getClient();
    const messages = toOpenAiMessages(request.messages);
    const tools = toOpenAiTools(request.tools);

    const response = await retryWithBackoff(
      () =>
        withTimeout(
          client.chat.completions.create(
            {
              model: request.model ?? this.model,
              messages,
              temperature: request.temperature,
              max_tokens: request.maxTokens,
              tools,
            },
            { signal: request.signal },
          ),
          this.timeoutMs,
          "OpenAI chat.completions.create",
        ),
      { maxAttempts: this.maxRetries + 1, signal: request.signal },
    ).catch((error) => {
      throw new Error(`OpenAI request failed: ${describeError(error)}`);
    });

    const choice = response.choices[0];
    const toolCalls = choice?.message?.tool_calls;
    if (toolCalls?.length) {
      return {
        content: choice.message.content ?? "",
        toolCalls: toolCalls
          .filter((call): call is typeof call & { type: "function" } => call.type === "function")
          .map((call) => ({ id: call.id, name: call.function.name, arguments: safeJsonParse(call.function.arguments) })),
        finishReason: "tool_calls",
      };
    }

    return {
      content: choice?.message?.content ?? "",
      finishReason: choice?.finish_reason === "length" ? "length" : "stop",
    };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const client = this.getClient();
    const messages = toOpenAiMessages(request.messages);
    const tools = toOpenAiTools(request.tools);

    // Combine the caller's cancellation signal with a hard timeout so a
    // stalled upstream stream can't hang the request forever.
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = request.signal ? AbortSignal.any([request.signal, timeoutSignal]) : timeoutSignal;

    let streamResponse: Awaited<ReturnType<typeof client.chat.completions.create>>;
    try {
      streamResponse = await retryWithBackoff(
        () =>
          client.chat.completions.create(
            {
              model: request.model ?? this.model,
              messages,
              temperature: request.temperature,
              max_tokens: request.maxTokens,
              tools,
              stream: true,
            },
            { signal: combinedSignal },
          ),
        { maxAttempts: this.maxRetries + 1, signal: request.signal },
      );
    } catch (error) {
      throw new Error(`OpenAI streaming request failed: ${describeError(error)}`);
    }

    // Tool call argument fragments arrive incrementally, indexed by position.
    const toolCallAccumulator = new Map<number, { id: string; name: string; args: string }>();
    let finishReason: AiCompletionResult["finishReason"] = "stop";

    try {
      // `streamResponse` is a Stream<ChatCompletionChunk> when stream: true.
      for await (const chunk of streamResponse as AsyncIterable<{
        choices: Array<{
          delta: { content?: string | null; tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> };
          finish_reason?: string | null;
        }>;
      }>) {
        if (request.signal?.aborted) return;
        const choice = chunk.choices[0];
        if (!choice) continue;

        if (choice.delta?.content) {
          yield { delta: choice.delta.content, done: false };
        }

        for (const partial of choice.delta?.tool_calls ?? []) {
          const existing = toolCallAccumulator.get(partial.index) ?? { id: "", name: "", args: "" };
          if (partial.id) existing.id = partial.id;
          if (partial.function?.name) existing.name += partial.function.name;
          if (partial.function?.arguments) existing.args += partial.function.arguments;
          toolCallAccumulator.set(partial.index, existing);
        }

        if (choice.finish_reason === "tool_calls") finishReason = "tool_calls";
        else if (choice.finish_reason === "length") finishReason = "length";
      }
    } catch (error) {
      this.logger.error(`OpenAI stream interrupted: ${describeError(error)}`);
      throw new Error(`OpenAI streaming request failed: ${describeError(error)}`);
    }

    if (toolCallAccumulator.size > 0) {
      const toolCalls: AiToolCall[] = [...toolCallAccumulator.values()].map((call) => ({
        id: call.id,
        name: call.name,
        arguments: safeJsonParse(call.args),
      }));
      yield { delta: "", done: true, toolCalls, finishReason: "tool_calls" };
    } else {
      yield { delta: "", done: true, finishReason };
    }
  }
}

function toOpenAiTools(tools: AiToolDefinition[] | undefined): ChatCompletionTool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  }));
}

function toOpenAiMessages(messages: AiMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message): ChatCompletionMessageParam => {
    if (message.role === "tool") {
      return { role: "tool", tool_call_id: message.toolCallId ?? "", content: message.content };
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: JSON.stringify(call.arguments) },
        })),
      };
    }
    if (message.role === "system") return { role: "system", content: message.content };
    if (message.role === "assistant") return { role: "assistant", content: message.content };
    return { role: "user", content: message.content };
  });
}

function safeJsonParse(text: string): Record<string, unknown> {
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : { result: parsed };
  } catch {
    return { result: text };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}
