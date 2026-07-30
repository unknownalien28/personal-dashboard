import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import type { Content, FunctionCall, FunctionDeclaration, Part } from "@google/genai";
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
 * Production Google Gemini provider, backed by the official `@google/genai`
 * SDK. Reads its API key from `AI_GEMINI_API_KEY` at request time — nothing
 * is hardcoded or persisted. If the key is missing, every call fails with a
 * clear, descriptive error instead of throwing an SDK-level exception.
 */
@Injectable()
export class GeminiProvider implements AiProvider {
  readonly key = "gemini";
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.geminiApiKey");
  }

  private getClient(): GoogleGenAI {
    const apiKey = this.config.get<string>("ai.geminiApiKey");
    if (!apiKey) {
      throw new Error(
        'The "gemini" provider is not configured. Set AI_GEMINI_API_KEY in the environment to enable it.',
      );
    }
    // Lazily construct once; the SDK client itself is stateless per-request.
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  private get model(): string {
    return this.config.get<string>("ai.geminiModel") ?? "gemini-2.5-flash";
  }

  private get timeoutMs(): number {
    return this.config.get<number>("ai.requestTimeoutMs") ?? 30_000;
  }

  private get maxRetries(): number {
    return this.config.get<number>("ai.maxRetries") ?? 2;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const client = this.getClient();
    const { systemInstruction, contents } = toGeminiContents(request.messages);
    const tools = request.tools?.length ? [{ functionDeclarations: request.tools.map(toGeminiFunctionDeclaration) }] : undefined;

    const response = await retryWithBackoff(
      () =>
        withTimeout(
          client.models.generateContent({
            model: request.model ?? this.model,
            contents,
            config: {
              systemInstruction,
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens,
              tools,
              abortSignal: request.signal,
            },
          }),
          this.timeoutMs,
          "Gemini generateContent",
        ),
      { maxAttempts: this.maxRetries + 1, signal: request.signal },
    ).catch((error) => {
      throw new Error(`Gemini request failed: ${describeError(error)}`);
    });

    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length > 0) {
      return {
        content: response.text ?? "",
        toolCalls: functionCalls.map(toAiToolCall),
        finishReason: "tool_calls",
      };
    }

    return { content: response.text ?? "", finishReason: "stop" };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const client = this.getClient();
    const { systemInstruction, contents } = toGeminiContents(request.messages);
    const tools = request.tools?.length ? [{ functionDeclarations: request.tools.map(toGeminiFunctionDeclaration) }] : undefined;

    // Combine the caller's cancellation signal with a hard timeout so a
    // stalled upstream stream can't hang the request forever.
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = request.signal ? AbortSignal.any([request.signal, timeoutSignal]) : timeoutSignal;

    let streamIterator: AsyncGenerator<{ text?: string; functionCalls?: FunctionCall[] }>;
    try {
      streamIterator = await retryWithBackoff(
        () =>
          client.models.generateContentStream({
            model: request.model ?? this.model,
            contents,
            config: {
              systemInstruction,
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens,
              tools,
              abortSignal: combinedSignal,
            },
          }),
        { maxAttempts: this.maxRetries + 1, signal: request.signal },
      );
    } catch (error) {
      throw new Error(`Gemini streaming request failed: ${describeError(error)}`);
    }

    const collectedCalls: FunctionCall[] = [];
    try {
      for await (const chunk of streamIterator) {
        if (request.signal?.aborted) return;
        if (chunk.functionCalls?.length) collectedCalls.push(...chunk.functionCalls);
        const delta = chunk.text ?? "";
        if (delta) yield { delta, done: false };
      }
    } catch (error) {
      this.logger.error(`Gemini stream interrupted: ${describeError(error)}`);
      throw new Error(`Gemini streaming request failed: ${describeError(error)}`);
    }

    if (collectedCalls.length > 0) {
      yield { delta: "", done: true, toolCalls: collectedCalls.map(toAiToolCall), finishReason: "tool_calls" };
    } else {
      yield { delta: "", done: true, finishReason: "stop" };
    }
  }
}

function toGeminiFunctionDeclaration(tool: AiToolDefinition): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.parameters,
  };
}

function toAiToolCall(call: FunctionCall, index: number): AiToolCall {
  return {
    id: call.id ?? `gemini-call-${index}-${Date.now()}`,
    name: call.name ?? "unknown_tool",
    arguments: (call.args as Record<string, unknown>) ?? {},
  };
}

/**
 * Gemini has no "system" role and no "tool" role in `contents` — system
 * prompts go in a separate `systemInstruction`, and tool results are sent
 * back as a `user` turn containing a `functionResponse` part.
 */
function toGeminiContents(messages: AiMessage[]): { systemInstruction: string | undefined; contents: Content[] } {
  const systemParts: string[] = [];
  const contents: Content[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
      continue;
    }

    if (message.role === "tool") {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: message.name ?? "unknown_tool", response: safeJsonParse(message.content) } }],
      });
      continue;
    }

    if (message.role === "assistant" && message.toolCalls?.length) {
      const parts: Part[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const call of message.toolCalls) {
        parts.push({ functionCall: { id: call.id, name: call.name, args: call.arguments } });
      }
      contents.push({ role: "model", parts });
      continue;
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    });
  }

  return { systemInstruction: systemParts.length ? systemParts.join("\n\n") : undefined, contents };
}

function safeJsonParse(text: string): Record<string, unknown> {
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
