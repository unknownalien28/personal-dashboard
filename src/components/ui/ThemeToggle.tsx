import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/lib/theme-store";
import { cn } from "@/lib/utils/cn";

const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light theme", icon: Sun },
  { mode: "dark", label: "Dark theme", icon: Moon },
  { mode: "system", label: "System theme", icon: Monitor },
];

/** Three-way Light/Dark/System control, for pages the person sees before AppShell's Topbar exists (Welcome/Login/Register/etc). */
export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] p-0.5", className)}
    >
      {options.map(({ mode: optionMode, label, icon: Icon }) => (
        <button
          key={optionMode}
          type="button"
          role="radio"
          aria-checked={mode === optionMode}
          aria-label={label}
          title={label}
          onClick={() => setMode(optionMode)}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md transition-colors duration-150",
            mode === optionMode
              ? "bg-accent-500 text-white"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
