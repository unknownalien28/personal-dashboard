import { Injectable, NotFoundException } from "@nestjs/common";
import { AiProvider } from "./ai-provider.interface";
import { DemoAiProvider } from "./demo.provider";
import { AnthropicProvider, GeminiProvider, OllamaProvider, OpenAiProvider } from "./external-providers.stub";

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
    // Registered but not yet functional — each throws a clear "not implemented"
    // error until its real HTTP client is wired up. This lets the frontend
    // list all four providers now without any of them silently no-op-ing.
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

  listAvailable(): string[] {
    return [...this.providers.keys()];
  }
}
