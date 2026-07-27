import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type StatusFilter = "all" | "active" | "completed";
export type SortMode = "dueDate" | "priority" | "created";

interface TaskFiltersProps {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
}

export function TaskFilters({
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
      <SegmentedControl
        value={status}
        onChange={onStatusChange}
        options={[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Done" },
        ]}
      />

      <div className="flex gap-2 sm:ml-auto">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-9 flex-1 sm:flex-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          className="h-9 flex-1 sm:flex-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="dueDate">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
          <option value="created">Sort: Newest</option>
        </select>
      </div>
    </div>
  );
}
