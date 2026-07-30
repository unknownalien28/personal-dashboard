import type { AIProviderKey } from "@/types/models";
import type { AIProvider } from "./types";
import { demoProvider } from "./demo";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { ollamaProvider } from "./ollama";

/**
 * Every registered provider, in the order they should appear in Settings.
 * Adding a new backend is exactly: write an adapter satisfying `AIProvider`,
 * add it here, add its key to `AIProviderKey` in types/models.ts. Nothing
 * else in the app (store, chat service, UI) needs to change.
 */
export const providers: Record<AIProviderKey, AIProvider> = {
  demo: demoProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

export const providerList: AIProvider[] = [demoProvider, openaiProvider, anthropicProvider, geminiProvider, ollamaProvider];

export function getProvider(key: AIProviderKey): AIProvider {
  return providers[key] ?? demoProvider;
}
