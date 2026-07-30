import type { AIProviderKey } from "@/types/models";

export interface ProviderMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderRequest {
  apiKey: string;
  model: string;
  messages: ProviderMessage[];
  temperature: number;
  maxTokens: number;
  stream: boolean;
  signal?: AbortSignal;
}

export interface ProviderTestParams {
  apiKey: string;
  model: string;
}

export interface ProviderTestResult {
  ok: boolean;
  message: string;
}

export interface ModelOption {
  value: string;
  label: string;
}

/**
 * The contract every AI backend adapter implements. The chat UI and the
 * conversations store only ever talk to this interface - never to a
 * provider's SDK or REST shape directly - so a new backend (or a future
 * local-model runtime) can be added by dropping in one more file here and
 * registering it in `registry.ts`.
 */
export interface AIProvider {
  key: AIProviderKey;
  label: string;
  description: string;
  models: ModelOption[];
  requiresApiKey: boolean;
  apiKeyHelpUrl?: string;

  /**
   * Sends a chat request. When `request.stream` is true and `onToken` is
   * given, the adapter calls `onToken` with each incremental chunk as it
   * arrives and resolves with the full accumulated text at the end. When
   * streaming is off (or the caller omits `onToken`), it resolves once with
   * the complete response.
   */
  send(request: ProviderRequest, onToken?: (chunk: string) => void): Promise<string>;

  /** A minimal request used by the "Test Connection" action in AI Settings. */
  testConnection(params: ProviderTestParams): Promise<ProviderTestResult>;
}
