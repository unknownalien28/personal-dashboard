import type { AIProvider, ProviderRequest, ProviderTestResult } from "./types";
import { respondLocally } from "@/features/ai/local-intelligence";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const demoProvider: AIProvider = {
  key: "demo",
  label: "Demo (no key required)",
  description: "Runs entirely locally - real answers about your tasks, notes, calendar, goals, and finances, no API key needed.",
  models: [{ value: "demo-1", label: "Demo Assistant" }],
  requiresApiKey: false,

  async send(request: ProviderRequest, onToken) {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const { text, actionBlock } = respondLocally(lastUser?.content ?? "");
    const full = actionBlock ? `${text}\n\n${actionBlock}` : text;

    if (!request.stream || !onToken) {
      await wait(300);
      return full;
    }

    const words = full.split(/(\s+)/);
    let acc = "";
    for (const word of words) {
      if (request.signal?.aborted) break;
      acc += word;
      onToken(word);
      await wait(14);
    }
    return acc;
  },

  async testConnection(): Promise<ProviderTestResult> {
    return { ok: true, message: "Demo mode runs locally - you're all set, no connection needed." };
  },
};
