import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Pin, PinOff, CornerDownLeft, Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav-items";
import { commandRegistry } from "./command-registry";
import { useCommandPaletteStore } from "./command-palette-store";
import { universalSearch, type SearchHit, type UniversalSearchResults } from "@/features/ai/universal-search";
import { askAlien } from "@/features/ai/ask-alien";

interface ResultRow {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  onSelect: () => void;
  pinnable?: boolean;
}

const MODULE_LABELS: Record<keyof UniversalSearchResults, string> = {
  tasks: "Tasks",
  notes: "Notes",
  goals: "Goals",
  calendar: "Calendar",
  finance: "Finance",
  conversations: "Chats",
  content: "Content",
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { recentIds, pinnedIds, recordUsed, togglePinned } = useCommandPaletteStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  function go(to: string) {
    navigate(to);
    close();
  }

  function runAskAlien(text: string) {
    askAlien(text);
    close();
  }

  const rows = useMemo<ResultRow[]>(() => {
    const q = query.trim();
    const results: ResultRow[] = [];

    if (!q) {
      const pinned = commandRegistry.filter((c) => pinnedIds.includes(c.id));
      const recent = recentIds.map((id) => commandRegistry.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);

      if (pinned.length > 0) {
        for (const cmd of pinned) {
          results.push({ id: cmd.id, label: cmd.label, sublabel: cmd.hint, group: "Pinned", pinnable: true, onSelect: () => { recordUsed(cmd.id); cmd.run(navigate); close(); } });
        }
      }
      if (recent.length > 0) {
        for (const cmd of recent) {
          results.push({ id: `recent-${cmd.id}`, label: cmd.label, sublabel: cmd.hint, group: "Recent", pinnable: true, onSelect: () => { recordUsed(cmd.id); cmd.run(navigate); close(); } });
        }
      }
      for (const item of navItems) {
        results.push({ id: `page-${item.to}`, label: item.label, group: "Pages", onSelect: () => go(item.to) });
      }
      for (const cmd of commandRegistry) {
        results.push({ id: cmd.id, label: cmd.label, sublabel: cmd.hint, group: "Quick actions", pinnable: true, onSelect: () => { recordUsed(cmd.id); cmd.run(navigate); close(); } });
      }
      return results;
    }

    // ">" prefix narrows to quick actions only, matching the spec's example syntax.
    if (q.startsWith(">")) {
      const term = q.slice(1).trim().toLowerCase();
      for (const cmd of commandRegistry) {
        if (!term || cmd.label.toLowerCase().includes(term) || cmd.hint?.toLowerCase().includes(term)) {
          results.push({ id: cmd.id, label: cmd.label, sublabel: cmd.hint, group: "Quick actions", pinnable: true, onSelect: () => { recordUsed(cmd.id); cmd.run(navigate); close(); } });
        }
      }
      return results;
    }

    results.push({
      id: "ask-alien-query",
      label: `Ask Alien: "${q}"`,
      group: "Run AI",
      onSelect: () => runAskAlien(q),
    });

    const lowerQ = q.toLowerCase();
    for (const item of navItems) {
      if (item.label.toLowerCase().includes(lowerQ)) {
        results.push({ id: `page-${item.to}`, label: item.label, group: "Pages", onSelect: () => go(item.to) });
      }
    }

    const search = universalSearch(q, 5);
    (Object.keys(MODULE_LABELS) as (keyof UniversalSearchResults)[]).forEach((module) => {
      search[module].forEach((hit: SearchHit) => {
        results.push({ id: `${module}-${hit.id}`, label: hit.label, sublabel: hit.sublabel ?? MODULE_LABELS[module], group: MODULE_LABELS[module], onSelect: () => go(hit.to) });
      });
    });

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, recentIds, pinnedIds, navigate]);

  useEffect(() => setActiveIndex(0), [rows.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      rows[activeIndex]?.onSelect();
    }
  }

  if (!isOpen) return null;

  let lastGroup = "";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] modal-backdrop-in" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] glass-panel shadow-2xl modal-sheet-in overflow-hidden flex flex-col max-h-[70vh]"
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--color-border)] shrink-0">
          <Sparkles className="h-4 w-4 text-accent-500 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, notes, chats… or type > for actions"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="text-[10px] text-zinc-400 border border-[var(--color-border)] rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div className="overflow-y-auto py-1.5">
          {rows.length === 0 && <p className="px-4 py-6 text-sm text-zinc-400 text-center">No matches.</p>}
          {rows.map((row, i) => {
            const showHeader = row.group !== lastGroup;
            lastGroup = row.group;
            return (
              <div key={row.id}>
                {showHeader && (
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {row.group}
                  </p>
                )}
                <div
                  className={`group flex items-center gap-2 px-4 py-2 mx-1.5 rounded-lg cursor-pointer transition-colors ${
                    i === activeIndex ? "bg-accent-50 dark:bg-accent-500/15" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={row.onSelect}
                >
                  <div className="flex-1 min-w-0 flex items-baseline gap-2">
                    <span className="text-sm text-zinc-700 dark:text-zinc-200 truncate">{row.label}</span>
                    {row.sublabel && <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{row.sublabel}</span>}
                  </div>
                  {row.pinnable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinned(row.id.replace(/^recent-/, ""));
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0"
                      title="Pin"
                    >
                      {pinnedIds.includes(row.id.replace(/^recent-/, "")) ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {i === activeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
