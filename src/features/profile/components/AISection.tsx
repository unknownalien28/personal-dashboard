import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/features/profile/settings-store";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import type { AIProviderKey } from "@/types/models";

interface ProviderOption {
  key: AIProviderKey;
  label: string;
  description: string;
}

// Static labels/descriptions for the UI — actual availability (whether each
// provider has an API key configured) comes from the backend at runtime via
// GET /ai/providers, never from anything stored in the browser.
const PROVIDER_OPTIONS: ProviderOption[] = [
  { key: "auto", label: "Auto (recommended)", description: "Gemini first, then the local Ollama model, then any other configured provider." },
  { key: "gemini", label: "Gemini", description: "Google's Gemini — AlienOS's primary cloud provider." },
  { key: "ollama", label: "Ollama (local)", description: "Runs fully offline on your own machine — no data leaves your network." },
  { key: "openai", label: "OpenAI", description: "GPT models via OpenAI." },
  { key: "anthropic", label: "Anthropic", description: "Claude models via Anthropic." },
  { key: "demo", label: "Demo", description: "A local, deterministic responder — no AI provider required. Useful for trying the UI." },
];

interface ProviderStatus {
  key: string;
  configured: boolean;
}

export function AISection() {
  const { ai, updateAISettings } = useSettingsStore();
  const [status, setStatus] = useState<ProviderStatus[] | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ providers: ProviderStatus[] }>("/ai/providers")
      .then((res) => {
        if (!cancelled) setStatus(res.providers);
      })
      .catch(() => {
        if (!cancelled) setStatusError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function statusFor(key: AIProviderKey): ProviderStatus | undefined {
    if (key === "auto") return undefined;
    return status?.find((s) => s.key === key);
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 h-14">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enable AI</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Turn Alien Assistant on or off entirely</p>
        </div>
        <input
          type="checkbox"
          checked={ai.enabled}
          onChange={(e) => updateAISettings({ enabled: e.target.checked })}
          className="h-5 w-5 rounded accent-accent-500"
        />
      </label>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Provider</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          API keys are configured server-side by whoever runs AlienOS — the browser never talks to Gemini/OpenAI/Anthropic/Ollama directly, and never
          stores a key.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PROVIDER_OPTIONS.map((p) => {
            const s = statusFor(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => updateAISettings({ provider: p.key })}
                aria-pressed={ai.provider === p.key}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors duration-150",
                  ai.provider === p.key
                    ? "border-accent-400 bg-accent-50 dark:bg-accent-500/15"
                    : "border-[var(--color-border)] hover:bg-zinc-100 dark:hover:bg-zinc-800",
                )}
              >
                <span className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      ai.provider === p.key ? "text-accent-700 dark:text-accent-400" : "text-zinc-700 dark:text-zinc-300",
                    )}
                  >
                    {p.label}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</span>
                </span>
                {s && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs shrink-0",
                      s.configured ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500",
                    )}
                  >
                    {s.configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {s.configured ? "Configured" : "Not configured"}
                  </span>
                )}
                {!s && p.key === "auto" && status === null && !statusError && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
              </button>
            );
          })}
        </div>
        {statusError && <p className="text-xs text-danger mt-2">Couldn't reach the backend to check provider status.</p>}
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Model override</h3>
        <input
          type="text"
          value={ai.model}
          onChange={(e) => updateAISettings({ model: e.target.value })}
          placeholder="Leave blank to use the provider's default model"
          className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 font-mono"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          e.g. gemini-2.5-flash, gpt-4.1-mini, claude-sonnet-4-5, llama3.2:3b — set by whoever runs the server unless overridden here.
        </p>
      </div>

      <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 h-14">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Streaming</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Show responses as they're generated</p>
        </div>
        <input
          type="checkbox"
          checked={ai.streaming}
          onChange={(e) => updateAISettings({ streaming: e.target.checked })}
          className="h-5 w-5 rounded accent-accent-500"
        />
      </label>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Temperature</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">{ai.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={ai.temperature}
          onChange={(e) => updateAISettings({ temperature: Number(e.target.value) })}
          className="w-full accent-accent-500"
        />
        <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Max output tokens</h3>
        <input
          type="number"
          min={64}
          max={8000}
          step={64}
          value={ai.maxTokens}
          onChange={(e) => updateAISettings({ maxTokens: Number(e.target.value) })}
          className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
    </div>
  );
}
