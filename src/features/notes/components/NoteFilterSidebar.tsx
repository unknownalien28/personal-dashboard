import { forwardRef } from "react";
import { Search, StickyNote, Pin, Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type NoteFilter = "all" | "pinned" | "archived" | "trash";

interface NoteFilterSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  counts: Record<NoteFilter, number>;
}

const filterItems: { value: NoteFilter; label: string; icon: typeof StickyNote }[] = [
  { value: "all", label: "All Notes", icon: StickyNote },
  { value: "pinned", label: "Pinned", icon: Pin },
  { value: "archived", label: "Archived", icon: Archive },
  { value: "trash", label: "Trash", icon: Trash2 },
];

export const NoteFilterSidebar = forwardRef<HTMLInputElement, NoteFilterSidebarProps>(
  ({ search, onSearchChange, filter, onFilterChange, counts }, searchRef) => {
    return (
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Search notes</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-11 md:h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </label>

        <nav aria-label="Note filters" className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {filterItems.map((item) => (
            <button
              key={item.value}
              onClick={() => onFilterChange(item.value)}
              aria-current={filter === item.value}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 h-11 md:h-9 text-sm font-medium transition-colors duration-150 shrink-0",
                filter === item.value
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
              <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                {counts[item.value]}
              </span>
            </button>
          ))}
        </nav>
      </div>
    );
  }
);

NoteFilterSidebar.displayName = "NoteFilterSidebar";
