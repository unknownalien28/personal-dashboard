import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/features/profile/settings-store";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

interface AiStatus {
  provider: string;
  configured: boolean;
}

export function AISection() {
  const { ai, updateAISettings } = useSettingsStore();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<AiStatus>("/ai/status")
      .then((res) => {
        if (!cancelled) setStatus(res);
      })
      .catch(() => {
        if (!cancelled) setStatusError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">AI provider</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Alien is powered by Google Gemini. The API key is configured server-side by whoever runs AlienOS — the browser never talks to
          Gemini directly, and never stores a key.
        </p>
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5",
            "border-[var(--color-border)]",
          )}
        >
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Gemini</span>
          {status && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs shrink-0",
                status.configured ? "text-emerald-600 dark:text-emerald-400" : "text-danger",
              )}
            >
              {status.configured ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {status.configured ? "Configured" : "Not configured"}
            </span>
          )}
          {!status && !statusError && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />}
        </div>
        {statusError && <p className="text-xs text-danger mt-2">Couldn't reach the backend to check AI status.</p>}
        {status && !status.configured && (
          <p className="text-xs text-danger mt-2">
            Gemini isn't configured yet — chat will show a clear error until GEMINI_API_KEY is set in the backend environment.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Model override</h3>
        <input
          type="text"
          value={ai.model}
          onChange={(e) => updateAISettings({ model: e.target.value })}
          placeholder="Leave blank to use the server's default model"
          className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 font-mono"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          e.g. gemini-3.6-flash — set by whoever runs the server (AI_GEMINI_MODEL) unless overridden here.
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
