import { Info, Keyboard, ScrollText, Heart } from "lucide-react";

const APP_VERSION = "1.0.0";

const shortcuts: { keys: string; description: string; scope: string }[] = [
  { keys: "Ctrl / Cmd + N", description: "Create new note", scope: "Notes" },
  { keys: "Ctrl / Cmd + S", description: "Save the open note", scope: "Notes" },
  { keys: "Ctrl / Cmd + F", description: "Focus search", scope: "Notes" },
  { keys: "Ctrl / Cmd + N", description: "Create new event", scope: "Calendar" },
  { keys: "← / →", description: "Previous / next period", scope: "Calendar" },
  { keys: "T", description: "Jump to today", scope: "Calendar" },
  { keys: "Esc", description: "Close a dialog or panel", scope: "Global" },
];

const dependencies: { name: string; license: string }[] = [
  { name: "React", license: "MIT" },
  { name: "Vite", license: "MIT" },
  { name: "TypeScript", license: "Apache-2.0" },
  { name: "Tailwind CSS", license: "MIT" },
  { name: "Zustand", license: "MIT" },
  { name: "React Router", license: "MIT" },
  { name: "date-fns", license: "MIT" },
  { name: "Recharts", license: "MIT" },
  { name: "Lucide Icons", license: "ISC" },
];

export function AboutSection() {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="rounded-lg border border-[var(--color-border)] p-4 flex items-center gap-3">
        <Info className="h-5 w-5 text-zinc-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Personal Dashboard</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Version {APP_VERSION} — built with Vite, React, and TypeScript
          </p>
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          <Keyboard className="h-4 w-4" /> Keyboard shortcuts
        </h3>
        <div className="flex flex-col gap-1.5">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)] last:border-0">
              <div>
                <span className="text-zinc-600 dark:text-zinc-300">{s.description}</span>
                <span className="text-zinc-400 dark:text-zinc-500"> — {s.scope}</span>
              </div>
              <kbd className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          <ScrollText className="h-4 w-4" /> Open-source licenses
        </h3>
        <div className="flex flex-col gap-1">
          {dependencies.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs py-1">
              <span className="text-zinc-600 dark:text-zinc-300">{d.name}</span>
              <span className="text-zinc-400 dark:text-zinc-500">{d.license}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Heart className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>Built as a personal productivity project. All data stays in your browser's local storage.</p>
      </div>
    </div>
  );
}
