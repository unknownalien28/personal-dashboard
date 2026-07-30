import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { universalSearch, type SearchHit, type UniversalSearchResults } from "@/features/ai/universal-search";

const MODULE_LABELS: Record<keyof UniversalSearchResults, string> = {
  tasks: "Tasks",
  notes: "Notes",
  goals: "Goals",
  calendar: "Calendar",
  finance: "Finance",
  conversations: "Chats",
  content: "Content",
};

interface GlobalSearchProps {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}

export function GlobalSearch({ className, autoFocus, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const results = query.trim() ? universalSearch(query) : null;
  const totalCount = results ? Object.values(results).reduce((sum, hits) => sum + hits.length, 0) : 0;
  const showDropdown = focused && query.trim().length > 0;

  function goTo(hit: SearchHit) {
    navigate(hit.to);
    setQuery("");
    setFocused(false);
    onNavigate?.();
  }

  return (
    <div className={cn("relative", className)}>
      <label className="flex items-center gap-2 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-zinc-400 focus-within:ring-2 focus-within:ring-accent-400 transition-shadow duration-150">
        <Search className="h-4 w-4 shrink-0" />
        <input
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search AlienOS…"
          className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
        />
      </label>

      {showDropdown && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-30 rounded-xl border border-[var(--color-border)] glass-panel shadow-xl max-h-80 overflow-y-auto py-1.5">
          {totalCount === 0 ? (
            <p className="px-3.5 py-3 text-xs text-zinc-400 dark:text-zinc-500">No results for "{query}" anywhere in AlienOS.</p>
          ) : (
            (Object.keys(MODULE_LABELS) as (keyof UniversalSearchResults)[])
              .filter((module) => (results?.[module]?.length ?? 0) > 0)
              .map((module) => (
                <div key={module}>
                  <p className="px-3.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {MODULE_LABELS[module]}
                  </p>
                  {results![module].map((hit) => (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => goTo(hit)}
                      className="w-full flex flex-col items-start px-3.5 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-200 truncate w-full">{hit.label}</span>
                      {hit.sublabel && <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate w-full">{hit.sublabel}</span>}
                    </button>
                  ))}
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
