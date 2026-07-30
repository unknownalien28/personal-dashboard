import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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

interface OllamaToolCall {
  id?: string;
  function?: { name?: string; arguments?: Record<string, unknown> | string };
}

interface OllamaChatResponseMessage {
  content?: string;
  tool_calls?: OllamaToolCall[];
}

/**
 * Ollama provider — the official offline/local AI provider for AlienOS.
 * Talks to a local/self-hosted Ollama server's `/api/chat` endpoint, which
 * mirrors the OpenAI tool-calling shape closely enough that the same
 * `tools`/`tool_calls` conventions apply. No official Node SDK is
 * published for Ollama, so this uses `fetch` directly against its
 * documented, stable HTTP API — a reasonable exception to "use the
 * official SDK" since there isn't one.
 *
 * The model is read from `OLLAMA_MODEL` (default `llama3.2:3b`) — never
 * hardcoded — and the server address from `OLLAMA_BASE_URL` (default
 * `http://localhost:11434`), so Ollama is available out of the box as the
 * automatic offline fallback behind Gemini in "auto" mode.
 */
@Injectable()
export class OllamaProvider implements AiProvider {
  readonly key = "ollama";
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.ollamaBaseUrl");
  }

  private get baseUrl(): string {
    return this.config.get<string>("ai.ollamaBaseUrl") ?? "http://localhost:11434";
  }

  private get model(): string {
    return this.config.get<string>("ai.ollamaModel") ?? "llama3.2:3b";
  }

  private get timeoutMs(): number {
    return this.config.get<number>("ai.requestTimeoutMs") ?? 30_000;
  }

  private get maxRetries(): number {
    return this.config.get<number>("ai.maxRetries") ?? 2;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const body = {
      model: request.model ?? this.model,
      messages: toOllamaMessages(request.messages),
      stream: false,
      tools: toOllamaTools(request.tools),
      options: { temperature: request.temperature },
    };

    const response = await retryWithBackoff(
      () =>
        withTimeout(
          fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: request.signal,
          }),
          this.timeoutMs,
          "Ollama /api/chat",
        ),
      { maxAttempts: this.maxRetries + 1, signal: request.signal },
    ).catch((error) => {
      throw new Error(`Ollama request failed: ${describeError(error)}`);
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: HTTP ${response.status} ${await safeText(response)}`);
    }

    const json = (await response.json()) as { message?: OllamaChatResponseMessage };
    const toolCalls = json.message?.tool_calls;
    if (toolCalls?.length) {
      return {
        content: json.message?.content ?? "",
        toolCalls: toolCalls.map(toAiToolCall),
        finishReason: "tool_calls",
      };
    }

    return { content: json.message?.content ?? "", finishReason: "stop" };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const combinedSignal = request.signal ? AbortSignal.any([request.signal, timeoutSignal]) : timeoutSignal;

    const body = {
      model: request.model ?? this.model,
      messages: toOllamaMessages(request.messages),
      stream: true,
      tools: toOllamaTools(request.tools),
      options: { temperature: request.temperature },
    };

    let response: Response;
    try {
      response = await retryWithBackoff(
        () =>
          fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: combinedSignal,
          }),
        { maxAttempts: this.maxRetries + 1, signal: request.signal },
      );
    } catch (error) {
      throw new Error(`Ollama streaming request failed: ${describeError(error)}`);
    }

    if (!response.ok || !response.body) {
      throw new Error(`Ollama streaming request failed: HTTP ${response.status} ${await safeText(response)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const collectedToolCalls: OllamaToolCall[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;

          const parsed = JSON.parse(line) as { message?: OllamaChatResponseMessage; done?: boolean };
          if (parsed.message?.tool_calls?.length) collectedToolCalls.push(...parsed.message.tool_calls);
          if (parsed.message?.content) yield { delta: parsed.message.content, done: false };

          if (parsed.done) {
            if (collectedToolCalls.length > 0) {
              yield { delta: "", done: true, toolCalls: collectedToolCalls.map(toAiToolCall), finishReason: "tool_calls" };
            } else {
              yield { delta: "", done: true, finishReason: "stop" };
            }
            return;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Ollama stream interrupted: ${describeError(error)}`);
      throw new Error(`Ollama streaming request failed: ${describeError(error)}`);
    }

    yield { delta: "", done: true, finishReason: "stop" };
  }
}

function toOllamaTools(tools: AiToolDefinition[] | undefined): Array<{ type: "function"; function: AiToolDefinition }> | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({ type: "function" as const, function: tool }));
}

function toAiToolCall(call: OllamaToolCall, index: number): AiToolCall {
  const rawArgs = call.function?.arguments;
  const args = typeof rawArgs === "string" ? safeJsonParse(rawArgs) : (rawArgs ?? {});
  return {
    id: call.id ?? `ollama-call-${index}-${Date.now()}`,
    name: call.function?.name ?? "unknown_tool",
    arguments: args,
  };
}

function toOllamaMessages(messages: AiMessage[]): Array<{ role: string; content: string; tool_call_id?: string }> {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    }
    return { role: m.role, content: m.content };
  });
}

function safeJsonParse(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : { result: parsed };
  } catch {
    return { result: text };
  }
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}
