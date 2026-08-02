import type { AIProvider, ProviderRequest, ProviderMessage, ProviderTestParams, ProviderTestResult } from "./types";
import { readLines, throwForBadResponse } from "./stream-utils";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** Gemini uses "model" instead of "assistant", has no system role, and nests text in parts[]. */
function toGeminiContents(messages: ProviderMessage[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function systemInstruction(messages: ProviderMessage[]) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  return system ? { parts: [{ text: system }] } : undefined;
}

interface GeminiChunk {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

function extractText(chunk: GeminiChunk): string {
  return chunk.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

async function chatRequest(request: ProviderRequest): Promise<Response> {
  const method = request.stream ? "streamGenerateContent" : "generateContent";
  const alt = request.stream ? "&alt=sse" : "";
  const url = `${BASE_URL}/models/${encodeURIComponent(request.model)}:${method}?key=${encodeURIComponent(request.apiKey)}${alt}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: toGeminiContents(request.messages),
      systemInstruction: systemInstruction(request.messages),
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
      },
    }),
    signal: request.signal,
  });
}

export const geminiProvider: AIProvider = {
  key: "gemini",
  label: "Google Gemini",
  description: "Gemini models via the Google AI API.",
  models: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  requiresApiKey: true,
  apiKeyHelpUrl: "https://aistudio.google.com/apikey",

  async send(request, onToken) {
    const response = await chatRequest(request);
    if (!response.ok) await throwForBadResponse(response, "Gemini");

    if (!request.stream || !onToken) {
      const data = (await response.json()) as GeminiChunk;
      return extractText(data);
    }

    let full = "";
    await readLines(response, (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) return;
      const payload = trimmed.slice(5).trim();
      if (!payload) return;
      try {
        const parsed = JSON.parse(payload) as GeminiChunk;
        const text = extractText(parsed);
        if (text) {
          full += text;
          onToken(text);
        }
      } catch {
        // ignore malformed/partial SSE line
      }
    });
    return full;
  },

  async testConnection(params: ProviderTestParams): Promise<ProviderTestResult> {
    try {
      const url = `${BASE_URL}/models/${encodeURIComponent(params.model)}?key=${encodeURIComponent(params.apiKey)}`;
      const response = await fetch(url);
      if (!response.ok) await throwForBadResponse(response, "Gemini");
      return { ok: true, message: "Connected to Gemini successfully." };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not reach Gemini." };
    }
  },
};
