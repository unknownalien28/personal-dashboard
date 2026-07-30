import { Injectable, NotFoundException } from "@nestjs/common";
import { AiProvider } from "./ai-provider.interface";
import { DemoAiProvider } from "./demo.provider";
import { OpenAiProvider } from "./openai.provider";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { OllamaProvider } from "./ollama.provider";

@Injectable()
export class AiProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();

  constructor(
    demoProvider: DemoAiProvider,
    openAiProvider: OpenAiProvider,
    anthropicProvider: AnthropicProvider,
    geminiProvider: GeminiProvider,
    ollamaProvider: OllamaProvider,
  ) {
    this.register(demoProvider);
    // Gemini is the primary/default provider (Phase 2), but every provider
    // is registered regardless of whether it's configured — this lets the
    // frontend list all of them under Settings > AI, each annotated with
    // whether it's actually usable right now (see listAvailable()).
    this.register(openAiProvider);
    this.register(anthropicProvider);
    this.register(geminiProvider);
    this.register(ollamaProvider);
  }

  register(provider: AiProvider): void {
    this.providers.set(provider.key, provider);
  }

  resolve(key: string): AiProvider {
    const provider = this.providers.get(key);
    if (!provider) {
      throw new NotFoundException(`AI provider "${key}" is not registered.`);
    }
    return provider;
  }

  tryResolveConfigured(key: string): AiProvider | undefined {
    const provider = this.providers.get(key);
    return provider?.isConfigured() ? provider : undefined;
  }

  listAvailable(): string[] {
    return [...this.providers.keys()];
  }

  /** Providers with a description of whether each is actually callable right now — used by GET /ai/providers. */
  listWithStatus(): Array<{ key: string; configured: boolean }> {
    return [...this.providers.values()].map((provider) => ({ key: provider.key, configured: provider.isConfigured() }));
  }
}
