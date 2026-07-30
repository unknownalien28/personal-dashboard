import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useSettingsStore } from "@/features/profile/settings-store";
import { providerList, getProvider } from "@/features/ai/providers/registry";
import { cn } from "@/lib/utils/cn";
import type { AIProviderKey } from "@/types/models";

export function AISection() {
  const { ai, updateAISettings } = useSettingsStore();
  const provider = getProvider(ai.provider);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  function handleProviderChange(key: AIProviderKey) {
    const next = getProvider(key);
    updateAISettings({ provider: key, model: next.models[0]?.value ?? "", apiKey: "" });
    setTestState("idle");
  }

  async function handleTestConnection() {
    setTestState("testing");
    try {
      const result = await provider.testConnection({ apiKey: ai.apiKey, model: ai.model });
      setTestState(result.ok ? "ok" : "error");
      setTestMessage(result.message);
    } catch (err) {
      setTestState("error");
      setTestMessage(err instanceof Error ? err.message : "Connection test failed.");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Provider</h3>
        <div className="grid grid-cols-1 gap-2">
          {providerList.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleProviderChange(p.key)}
              aria-pressed={ai.provider === p.key}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-4 py-2.5 text-left transition-colors duration-150",
                ai.provider === p.key
                  ? "border-accent-400 bg-accent-50 dark:bg-accent-500/15"
                  : "border-[var(--color-border)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  ai.provider === p.key ? "text-accent-700 dark:text-accent-400" : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {p.label}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Model</h3>
        <select
          value={ai.model}
          onChange={(e) => updateAISettings({ model: e.target.value })}
          className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        >
          {provider.models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {provider.requiresApiKey && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">API key</h3>
          <input
            type="password"
            value={ai.apiKey}
            onChange={(e) => updateAISettings({ apiKey: e.target.value })}
            placeholder="Paste your API key"
            autoComplete="off"
            className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 font-mono"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Stored only in this browser, never sent anywhere but {provider.label}.</p>
            {provider.apiKeyHelpUrl && (
              <a
                href={provider.apiKeyHelpUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-500 hover:text-accent-600 flex items-center gap-1 shrink-0"
              >
                Get a key <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {ai.provider === "ollama" && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Server URL</h3>
          <input
            type="text"
            value={ai.apiKey}
            onChange={(e) => updateAISettings({ apiKey: e.target.value })}
            placeholder="http://localhost:11434"
            className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 font-mono"
          />
        </div>
      )}

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
          max={8192}
          step={64}
          value={ai.maxTokens}
          onChange={(e) => updateAISettings({ maxTokens: Number(e.target.value) })}
          className="w-full h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testState === "testing"}
          className="h-10 rounded-lg border border-[var(--color-border)] text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {testState === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
          Test Connection
        </button>
        {testState === "ok" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> {testMessage}
          </p>
        )}
        {testState === "error" && (
          <p className="text-xs text-danger flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> {testMessage}
          </p>
        )}
      </div>
    </div>
  );
}
