/**
 * Every provider (OpenAI, Anthropic, Gemini, Ollama, ...) will implement this
 * contract in a later phase. Phase 9 intentionally ships ONLY the
 * abstraction plus a local `demo` provider — see AI PREPARATION in the
 * phase brief: "Do NOT implement providers yet."
 */
export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionChunk {
  delta: string;
  done: boolean;
}

export interface AiProvider {
  readonly key: string;
  /** Non-streaming completion. */
  complete(request: AiCompletionRequest): Promise<string>;
  /** Streaming completion — yields incremental chunks; last chunk has done=true. */
  stream(request: AiCompletionRequest): AsyncGenerator<AiCompletionChunk>;
}

export const AI_PROVIDER_REGISTRY = "AI_PROVIDER_REGISTRY";
