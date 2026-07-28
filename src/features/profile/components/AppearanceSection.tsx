import { Sun, Moon, Monitor } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useThemeStore, type ThemeMode } from "@/lib/theme-store";
import { useSettingsStore } from "@/features/profile/settings-store";
import { accentColorLabels, accentColorSwatch } from "@/lib/accent-colors";
import type { AccentColorKey, FontSize } from "@/types/models";
import { cn } from "@/lib/utils/cn";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AppearanceSection() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const { appearance, updateAppearance } = useSettingsStore();

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Theme</h3>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              aria-pressed={mode === opt.value}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-colors duration-150",
                mode === opt.value
                  ? "border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                  : "border-[var(--color-border)] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Accent color</h3>
        <div className="flex items-center gap-2.5">
          {(Object.keys(accentColorLabels) as AccentColorKey[]).map((key) => (
            <button
              key={key}
              onClick={() => updateAppearance({ accentColor: key })}
              aria-label={accentColorLabels[key]}
              aria-pressed={appearance.accentColor === key}
              style={{ backgroundColor: accentColorSwatch[key] }}
              className={cn(
                "h-8 w-8 rounded-full transition-transform",
                appearance.accentColor === key && "ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Font size</h3>
        <SegmentedControl
          value={appearance.fontSize}
          onChange={(v: FontSize) => updateAppearance({ fontSize: v })}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]}
        />
      </div>

      <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 h-14">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Compact mode</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Tighter spacing throughout the app</p>
        </div>
        <input
          type="checkbox"
          checked={appearance.compactMode}
          onChange={(e) => updateAppearance({ compactMode: e.target.checked })}
          className="h-5 w-5 rounded accent-accent-500"
        />
      </label>

      <label className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 h-14">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reduced motion</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Minimize animations and transitions</p>
        </div>
        <input
          type="checkbox"
          checked={appearance.reducedMotion}
          onChange={(e) => updateAppearance({ reducedMotion: e.target.checked })}
          className="h-5 w-5 rounded accent-accent-500"
        />
      </label>
    </div>
  );
}
