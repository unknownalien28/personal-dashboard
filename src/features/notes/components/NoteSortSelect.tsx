export type NoteSort = "updated" | "created" | "title" | "pinnedFirst";

interface NoteSortSelectProps {
  value: NoteSort;
  onChange: (value: NoteSort) => void;
}

export function NoteSortSelect({ value, onChange }: NoteSortSelectProps) {
  return (
    <label className="flex items-center">
      <span className="sr-only">Sort notes</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as NoteSort)}
        className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-zinc-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-accent-400"
      >
        <option value="updated">Sort: Last Edited</option>
        <option value="created">Sort: Created Date</option>
        <option value="title">Sort: Title</option>
        <option value="pinnedFirst">Sort: Pinned First</option>
      </select>
    </label>
  );
}
