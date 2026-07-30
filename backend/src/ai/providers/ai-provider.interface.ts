/**
 * Every provider (OpenAI, Anthropic, Gemini, Ollama, ...) implements this
 * contract. It supports plain chat completion, token streaming, and
 * tool/function calling so the orchestration layer (see ../orchestrator)
 * can drive multi-turn "the model asked to run a tool" loops identically
 * regardless of which vendor is behind it.
 */

/** A JSON-Schema object describing a tool's input. Kept generic (not a
 * vendor-specific type) so the same definition can be translated for
 * OpenAI, Anthropic, and Gemini without the tool authors caring. */
export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  /** Index signature so this structurally satisfies each SDK's own JSON-schema-ish parameter type (Anthropic's Tool.InputSchema, OpenAI's FunctionParameters) without needing per-provider casts. */
  [key: string]: unknown;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}

/** A single tool invocation the model asked for. */
export interface AiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type AiRole = "user" | "assistant" | "system" | "tool";

export interface AiMessage {
  role: AiRole;
  content: string;
  /** Present on assistant messages that requested one or more tool calls. */
  toolCalls?: AiToolCall[];
  /** Present on role "tool" messages: which AiToolCall.id this is a result for. */
  toolCallId?: string;
  /** Present on role "tool" messages: the tool's name (some providers require it alongside the id). */
  name?: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AiToolDefinition[];
  /** Allows the caller (orchestrator) to cancel an in-flight request, e.g. on SSE disconnect. */
  signal?: AbortSignal;
}

export type AiFinishReason = "stop" | "tool_calls" | "length" | "error";

export interface AiCompletionResult {
  content: string;
  toolCalls?: AiToolCall[];
  finishReason: AiFinishReason;
}

export interface AiStreamChunk {
  delta: string;
  done: boolean;
  /** Only ever present on the final chunk, when the model decided to call tools instead of (or in addition to) replying with text. */
  toolCalls?: AiToolCall[];
  finishReason?: AiFinishReason;
}

export interface AiProvider {
  readonly key: string;
  /** Whether this provider has everything it needs (e.g. an API key) to actually be called. */
  isConfigured(): boolean;
  /** Non-streaming completion. Supports tool calling via `request.tools`. */
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
  /** Streaming completion — yields incremental text chunks; the last chunk has done=true. */
  stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk>;
}

export const AI_PROVIDER_REGISTRY = "AI_PROVIDER_REGISTRY";
