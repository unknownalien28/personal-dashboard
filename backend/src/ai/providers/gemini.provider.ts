import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import type { Content, FunctionCall, FunctionDeclaration, Part } from "@google/genai";
import {
  AiCompletionRequest,
  AiCompletionResult,
  AiMessage,
  AiStreamChunk,
  AiTokenUsage,
  AiToolCall,
  AiToolDefinition,
} from "./gemini.types";
import { retryWithBackoff, combineWithTimeout } from "./provider-http.util";

/**
 * AlienOS's single AI provider, backed by the official `@google/genai` SDK.
 * Reads its API key from AI_GEMINI_API_KEY at request time - nothing is
 * hardcoded or persisted. If the key is missing, every call fails with a
 * clear, descriptive error (see isConfigured()/AiOrchestratorService,
 * which turns that into a user-friendly message rather than a raw
 * exception) - there is no fallback to another provider or a canned
 * response; a genuine failure is reported as one.
 */
@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  /** Whether Gemini has everything it needs (an API key) to actually be called. */
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
    // configuration.ts always supplies a default (currently gemini-3.6-flash)
    // even with no AI_GEMINI_MODEL set, so this is the single source of truth
    // for "what model do we use when the caller doesn't specify one" - no
    // second hardcoded default here to drift out of sync with it.
    return this.config.get<string>("ai.geminiModel")!;
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
    const { signal, cleanup } = combineWithTimeout(request.signal, this.timeoutMs);

    let response: Awaited<ReturnType<typeof client.models.generateContent>>;
    try {
      response = await retryWithBackoff(
        () =>
          client.models.generateContent({
            model: request.model ?? this.model,
            contents,
            config: {
              systemInstruction,
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens,
              tools,
              abortSignal: signal,
            },
          }),
        { maxAttempts: this.maxRetries + 1, signal: request.signal },
      );
    } catch (error) {
      throw new Error(`Gemini request failed: ${describeError(error)}`);
    } finally {
      cleanup();
    }

    const usage = toAiUsage(response.usageMetadata);
    const functionCalls = response.functionCalls ?? [];
    if (functionCalls.length > 0) {
      return {
        content: response.text ?? "",
        toolCalls: functionCalls.map(toAiToolCall),
        finishReason: "tool_calls",
        usage,
      };
    }

    return { content: response.text ?? "", finishReason: "stop", usage };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const client = this.getClient();
    const { systemInstruction, contents } = toGeminiContents(request.messages);
    const tools = request.tools?.length ? [{ functionDeclarations: request.tools.map(toGeminiFunctionDeclaration) }] : undefined;
    const { signal: combinedSignal, cleanup } = combineWithTimeout(request.signal, this.timeoutMs);

    let streamIterator: AsyncGenerator<{ text?: string; functionCalls?: FunctionCall[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }>;
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
      cleanup();
      throw new Error(`Gemini streaming request failed: ${describeError(error)}`);
    }

    const collectedCalls: FunctionCall[] = [];
    let usage: AiTokenUsage | undefined;
    try {
      for await (const chunk of streamIterator) {
        if (request.signal?.aborted) return;
        if (chunk.functionCalls?.length) collectedCalls.push(...chunk.functionCalls);
        // Gemini reports cumulative usageMetadata on multiple chunks as the
        // response progresses - each later chunk's totals supersede earlier
        // ones, so just keep overwriting; the last chunk received has the
        // final, complete counts.
        if (chunk.usageMetadata) usage = toAiUsage(chunk.usageMetadata);
        const delta = chunk.text ?? "";
        if (delta) yield { delta, done: false };
      }
    } catch (error) {
      this.logger.error(`Gemini stream interrupted: ${describeError(error)}`);
      throw new Error(`Gemini streaming request failed: ${describeError(error)}`);
    } finally {
      cleanup();
    }

    if (collectedCalls.length > 0) {
      yield { delta: "", done: true, toolCalls: collectedCalls.map(toAiToolCall), finishReason: "tool_calls", usage };
    } else {
      yield { delta: "", done: true, finishReason: "stop", usage };
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

function toAiUsage(usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | null | undefined): AiTokenUsage | undefined {
  if (!usage) return undefined;
  return { promptTokens: usage.promptTokenCount, completionTokens: usage.candidatesTokenCount, totalTokens: usage.totalTokenCount };
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
