import type { AIProvider, ProviderRequest, ProviderTestParams, ProviderTestResult } from "./types";
import { readLines, parseSseData, throwForBadResponse } from "./stream-utils";

const BASE_URL = "https://api.openai.com/v1";

interface OpenAIChunk {
  choices?: { delta?: { content?: string }; message?: { content?: string } }[];
}

async function chatRequest(request: ProviderRequest): Promise<Response> {
  return fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${request.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream,
    }),
    signal: request.signal,
  });
}

export const openaiProvider: AIProvider = {
  key: "openai",
  label: "OpenAI",
  description: "GPT models via the OpenAI API.",
  models: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "o3-mini", label: "o3-mini" },
  ],
  requiresApiKey: true,
  apiKeyHelpUrl: "https://platform.openai.com/api-keys",

  async send(request, onToken) {
    const response = await chatRequest(request);
    if (!response.ok) await throwForBadResponse(response, "OpenAI");

    if (!request.stream || !onToken) {
      const data = (await response.json()) as OpenAIChunk;
      return data.choices?.[0]?.message?.content ?? "";
    }

    let full = "";
    await readLines(response, (line) => {
      const payload = parseSseData(line);
      if (!payload) return;
      try {
        const parsed = JSON.parse(payload) as OpenAIChunk;
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // ignore malformed/partial SSE line
      }
    });
    return full;
  },

  async testConnection(params: ProviderTestParams): Promise<ProviderTestResult> {
    try {
      const response = await fetch(`${BASE_URL}/models/${encodeURIComponent(params.model)}`, {
        headers: { Authorization: `Bearer ${params.apiKey}` },
      });
      if (!response.ok) await throwForBadResponse(response, "OpenAI");
      return { ok: true, message: "Connected to OpenAI successfully." };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not reach OpenAI." };
    }
  },
};
