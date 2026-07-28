export type GoalSort = "progress" | "targetDate" | "created" | "updated" | "alphabetical";

interface GoalSortSelectProps {
  value: GoalSort;
  onChange: (value: GoalSort) => void;
}

export function GoalSortSelect({ value, onChange }: GoalSortSelectProps) {
  return (
    <label className="flex items-center">
      <span className="sr-only">Sort goals</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as GoalSort)}
        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-accent-400"
      >
        <option value="targetDate">Sort: Target Date</option>
        <option value="progress">Sort: Progress</option>
        <option value="created">Sort: Created Date</option>
        <option value="updated">Sort: Updated Date</option>
        <option value="alphabetical">Sort: Alphabetical</option>
      </select>
    </label>
  );
}
