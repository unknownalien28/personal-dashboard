import { forwardRef, useState } from "react";
import { Search, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "@/features/calendar/components/MiniCalendar";
import { cn } from "@/lib/utils/cn";

export type AgendaFilter = "today" | "upcoming" | "thisWeek" | "thisMonth" | "completed" | "archived";

const filterOptions: { value: AgendaFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

interface CalendarSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  month: Date;
  selectedDate: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  eventDateKeys: Set<string>;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onAddCategory: (name: string) => void;
  activeAgendaFilter: AgendaFilter | null;
  onAgendaFilterChange: (filter: AgendaFilter) => void;
  onCreateEvent: () => void;
}

export const CalendarSidebar = forwardRef<HTMLInputElement, CalendarSidebarProps>(
  (
    {
      search,
      onSearchChange,
      month,
      selectedDate,
      onMonthChange,
      onSelectDate,
      eventDateKeys,
      categories,
      activeCategory,
      onCategoryChange,
      onAddCategory,
      activeAgendaFilter,
      onAgendaFilterChange,
      onCreateEvent,
    },
    searchRef
  ) => {
    const [newCategory, setNewCategory] = useState("");

    function handleAddCategory(e: React.FormEvent) {
      e.preventDefault();
      if (newCategory.trim()) {
        onAddCategory(newCategory.trim());
        setNewCategory("");
      }
    }

    return (
      <div className="flex flex-col gap-5">
        <Button variant="primary" onClick={onCreateEvent} className="w-full">
          <Plus className="h-4 w-4" /> New event
        </Button>

        <label className="relative block">
          <span className="sr-only">Search events</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full h-11 md:h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </label>

        <MiniCalendar
          month={month}
          selectedDate={selectedDate}
          onMonthChange={onMonthChange}
          onSelectDate={onSelectDate}
          eventDateKeys={eventDateKeys}
        />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
            Categories
          </h3>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onCategoryChange(null)}
              aria-current={activeCategory === null}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 h-9 text-sm font-medium text-left transition-colors duration-150",
                activeCategory === null
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Tag className="h-3.5 w-3.5 shrink-0" /> All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                aria-current={activeCategory === cat}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 h-9 text-sm font-medium text-left transition-colors duration-150",
                  activeCategory === cat
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0" /> {cat}
              </button>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="flex gap-1.5 mt-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add category"
              aria-label="New category name"
              className="flex-1 h-8 rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
            />
            <button
              type="submit"
              aria-label="Add category"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
            Filters
          </h3>
          <div className="flex flex-col gap-0.5">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onAgendaFilterChange(opt.value)}
                aria-current={activeAgendaFilter === opt.value}
                className={cn(
                  "rounded-lg px-2.5 h-9 text-sm font-medium text-left transition-colors duration-150",
                  activeAgendaFilter === opt.value
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

CalendarSidebar.displayName = "CalendarSidebar";
