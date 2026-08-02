import type { AIProvider, ProviderRequest, ProviderTestParams, ProviderTestResult } from "./types";
import { readLines, throwForBadResponse } from "./stream-utils";

/** Ollama has no hosted endpoint - it always runs on the user's machine. The apiKey field is repurposed as the base URL. */
const DEFAULT_BASE_URL = "http://localhost:11434";

function baseUrlFrom(apiKey: string): string {
  return apiKey.trim() || DEFAULT_BASE_URL;
}

interface OllamaChunk {
  message?: { content?: string };
  done?: boolean;
}

async function chatRequest(request: ProviderRequest): Promise<Response> {
  return fetch(`${baseUrlFrom(request.apiKey)}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      stream: request.stream,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    }),
    signal: request.signal,
  });
}

export const ollamaProvider: AIProvider = {
  key: "ollama",
  label: "Ollama (local)",
  description: "Local models via a running Ollama server on this machine.",
  models: [
    { value: "llama3.1", label: "Llama 3.1" },
    { value: "mistral", label: "Mistral" },
    { value: "qwen2.5", label: "Qwen 2.5" },
  ],
  requiresApiKey: false,

  async send(request, onToken) {
    const response = await chatRequest(request);
    if (!response.ok) await throwForBadResponse(response, "Ollama");

    if (!request.stream || !onToken) {
      const data = (await response.json()) as OllamaChunk;
      return data.message?.content ?? "";
    }

    let full = "";
    await readLines(response, (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const parsed = JSON.parse(trimmed) as OllamaChunk;
        const delta = parsed.message?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // ignore malformed/partial line
      }
    });
    return full;
  },

  async testConnection(params: ProviderTestParams): Promise<ProviderTestResult> {
    try {
      const response = await fetch(`${baseUrlFrom(params.apiKey)}/api/tags`);
      if (!response.ok) await throwForBadResponse(response, "Ollama");
      return { ok: true, message: "Connected to your local Ollama server." };
    } catch {
      return {
        ok: false,
        message: "Could not reach Ollama. Make sure it's running locally (ollama serve).",
      };
    }
  },
};
