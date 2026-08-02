/**
 * Shared request/response shapes for talking to Gemini (see
 * ../providers/gemini.provider.ts). AlienOS calls Gemini directly - there
 * is deliberately no provider interface/registry here for swapping in
 * other vendors. These types exist because the orchestration layer
 * (conversation history, tool-calling loop, streaming, token accounting)
 * is written against a plain request-in/response-out shape rather than
 * Gemini's own SDK types directly, which keeps that logic readable and
 * makes it easy to unit-test with a fake instead of the real SDK.
 *
 * If AlienOS needs to support another provider again in the future, see
 * MIGRATION_REPORT_2026-08-02-single-provider.md for what that would
 * involve reintroducing.
 */

/** A JSON-Schema object describing a tool's input, in the shape Gemini's
 * SDK expects (FunctionDeclaration.parametersJsonSchema). */
export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  /** Index signature so this structurally satisfies Gemini SDK's own JSON-schema-ish parameter type (FunctionDeclaration.parametersJsonSchema) without needing a cast. */
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

/**
 * Token counts as reported by Gemini itself. All optional since a request
 * that fails before responding has none at all, and some paths only
 * report usage on the final chunk.
 */
export interface AiTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiCompletionResult {
  content: string;
  toolCalls?: AiToolCall[];
  finishReason: AiFinishReason;
  usage?: AiTokenUsage;
}

export interface AiStreamChunk {
  delta: string;
  done: boolean;
  /** Only ever present on the final chunk, when the model decided to call tools instead of (or in addition to) replying with text. */
  toolCalls?: AiToolCall[];
  finishReason?: AiFinishReason;
  /** Only ever present on the final chunk (done=true), when the provider/SDK exposes it for its streaming API. */
  usage?: AiTokenUsage;
}
