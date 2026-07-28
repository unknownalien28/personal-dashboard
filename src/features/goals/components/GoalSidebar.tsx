import { forwardRef, useState } from "react";
import { Search, Plus, Target, CheckCircle2, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { goalStatuses, goalStatusConfig } from "@/features/goals/goal-status-config";
import type { Priority, GoalStatus } from "@/types/models";

export type GoalPrimaryFilter = "active" | "completed" | "archived" | "trash";

const primaryFilters: { value: GoalPrimaryFilter; label: string; icon: typeof Target }[] = [
  { value: "active", label: "Active", icon: Target },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
  { value: "archived", label: "Archived", icon: Archive },
  { value: "trash", label: "Trash", icon: Trash2 },
];

interface GoalSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  primaryFilter: GoalPrimaryFilter;
  onPrimaryFilterChange: (filter: GoalPrimaryFilter) => void;
  counts: Record<GoalPrimaryFilter, number>;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onAddCategory: (name: string) => void;
  activePriority: Priority | null;
  onPriorityChange: (priority: Priority | null) => void;
  activeStatus: GoalStatus | null;
  onStatusChange: (status: GoalStatus | null) => void;
  onCreateGoal: () => void;
}

export const GoalSidebar = forwardRef<HTMLInputElement, GoalSidebarProps>(
  (
    {
      search,
      onSearchChange,
      primaryFilter,
      onPrimaryFilterChange,
      counts,
      categories,
      activeCategory,
      onCategoryChange,
      onAddCategory,
      activePriority,
      onPriorityChange,
      activeStatus,
      onStatusChange,
      onCreateGoal,
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
        <Button variant="primary" onClick={onCreateGoal} className="w-full">
          <Plus className="h-4 w-4" /> New goal
        </Button>

        <label className="relative block">
          <span className="sr-only">Search goals</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search goals..."
            className="w-full h-11 md:h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </label>

        <nav aria-label="Goal filters" className="flex flex-col gap-0.5">
          {primaryFilters.map((item) => (
            <button
              key={item.value}
              onClick={() => onPrimaryFilterChange(item.value)}
              aria-current={primaryFilter === item.value}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 h-10 md:h-9 text-sm font-medium text-left transition-colors duration-150",
                primaryFilter === item.value
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">{counts[item.value]}</span>
            </button>
          ))}
        </nav>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
            Category
          </h3>
          <select
            value={activeCategory ?? "all"}
            onChange={(e) => onCategoryChange(e.target.value === "all" ? null : e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400 mb-2"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <form onSubmit={handleAddCategory} className="flex gap-1.5">
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
            Priority
          </h3>
          <select
            value={activePriority ?? "all"}
            onChange={(e) => onPriorityChange(e.target.value === "all" ? null : (e.target.value as Priority))}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
            Status
          </h3>
          <select
            value={activeStatus ?? "all"}
            onChange={(e) => onStatusChange(e.target.value === "all" ? null : (e.target.value as GoalStatus))}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="all">All statuses</option>
            {goalStatuses.map((s) => (
              <option key={s} value={s}>
                {goalStatusConfig[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
);

GoalSidebar.displayName = "GoalSidebar";
