import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
  AiStreamChunk,
} from "./ai-provider.interface";

/**
 * Shared scaffold for providers that will eventually call a real external
 * API (OpenAI, Anthropic, Gemini, Ollama). Each subclass only supplies its
 * `key` and where to read its credential from config — the actual HTTP
 * call is intentionally NOT implemented yet.
 */
abstract class ExternalAiProviderStub implements AiProvider {
  abstract readonly key: string;
  abstract isConfigured(): boolean;
  protected abstract missingConfigMessage(): string;

  async complete(_request: AiCompletionRequest): Promise<AiCompletionResult> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(this.missingConfigMessage());
    }

    return {
      content: "",
      finishReason: "error",
    };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const result = await this.complete(request);

    yield {
      delta: result.content,
      done: true,
      finishReason: result.finishReason,
      toolCalls: result.toolCalls,
    };
  }
}

@Injectable()
export class OpenAiProvider extends ExternalAiProviderStub {
  readonly key = "openai";

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.openaiApiKey");
  }

  protected missingConfigMessage(): string {
    return "Set AI_OPENAI_API_KEY in the environment to enable the OpenAI provider.";
  }
}

@Injectable()
export class AnthropicProvider extends ExternalAiProviderStub {
  readonly key = "anthropic";

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.anthropicApiKey");
  }

  protected missingConfigMessage(): string {
    return "Set AI_ANTHROPIC_API_KEY in the environment to enable the Anthropic provider.";
  }
}

@Injectable()
export class GeminiProvider extends ExternalAiProviderStub {
  readonly key = "gemini";

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.geminiApiKey");
  }

  protected missingConfigMessage(): string {
    return "Set AI_GEMINI_API_KEY in the environment to enable the Gemini provider.";
  }
}

@Injectable()
export class OllamaProvider extends ExternalAiProviderStub {
  readonly key = "ollama";

  constructor(private readonly config: ConfigService) {
    super();
  }

  isConfigured(): boolean {
    return !!this.config.get<string>("ai.ollamaBaseUrl");
  }

  protected missingConfigMessage(): string {
    return "Set AI_OLLAMA_BASE_URL in the environment to enable the Ollama provider (defaults to http://localhost:11434).";
  }
}