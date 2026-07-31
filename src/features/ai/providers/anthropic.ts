import type { AIProvider, ProviderRequest, ProviderTestParams, ProviderTestResult } from "./types";
import { readLines, parseSseData, throwForBadResponse } from "./stream-utils";
import type { ProviderMessage } from "./types";

const BASE_URL = "https://api.anthropic.com/v1";
const ANTHROPIC_VERSION = "2023-06-01";

/** Anthropic takes `system` as a top-level field, not a message with role "system". */
function splitSystem(messages: ProviderMessage[]) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const rest = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, rest };
}

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}

interface AnthropicStreamEvent {
  type: string;
  delta?: { type: string; text?: string };
}

async function chatRequest(request: ProviderRequest): Promise<Response> {
  const { system, rest } = splitSystem(request.messages);
  return fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": request.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: request.model,
      system: system || undefined,
      messages: rest,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream,
    }),
    signal: request.signal,
  });
}

export const anthropicProvider: AIProvider = {
  key: "anthropic",
  label: "Anthropic Claude",
  description: "Claude models via the Anthropic API.",
  models: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet" },
    { value: "claude-opus-4-8", label: "Claude Opus" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku" },
  ],
  requiresApiKey: true,
  apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",

  async send(request, onToken) {
    const response = await chatRequest(request);
    if (!response.ok) await throwForBadResponse(response, "Anthropic");

    if (!request.stream || !onToken) {
      const data = (await response.json()) as AnthropicResponse;
      return data.content?.map((b) => b.text ?? "").join("") ?? "";
    }

    let full = "";
    await readLines(response, (line) => {
      const payload = parseSseData(line);
      if (!payload) return;
      try {
        const event = JSON.parse(payload) as AnthropicStreamEvent;
        if (event.type === "content_block_delta" && event.delta?.text) {
          full += event.delta.text;
          onToken(event.delta.text);
        }
      } catch {
        // ignore malformed/partial SSE line
      }
    });
    return full;
  },

  async testConnection(params: ProviderTestParams): Promise<ProviderTestResult> {
    try {
      const response = await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": params.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: params.model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });
      if (!response.ok) await throwForBadResponse(response, "Anthropic");
      return { ok: true, message: "Connected to Anthropic successfully." };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not reach Anthropic." };
    }
  },
};
