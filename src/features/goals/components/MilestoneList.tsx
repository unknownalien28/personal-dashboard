import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import type { Milestone } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface MilestoneListProps {
  milestones: Milestone[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function MilestoneList({ milestones, onAdd, onToggle, onEdit, onDelete }: MilestoneListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle("");
    }
  }

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setEditValue(m.title);
  }

  function commitEdit() {
    if (editingId && editValue.trim()) onEdit(editingId, editValue.trim());
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {milestones.length === 0 && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">No milestones yet.</p>
      )}
      <ul role="list" className="flex flex-col gap-1.5">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(m.id)}
              aria-label={m.completed ? "Mark milestone incomplete" : "Mark milestone complete"}
              className={cn(
                "h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-150",
                m.completed ? "bg-accent-500 border-accent-500" : "border-zinc-300 dark:border-zinc-600"
              )}
            >
              {m.completed && <Check className="h-3.5 w-3.5 text-white" />}
            </button>

            {editingId === m.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                className="flex-1 h-8 rounded-md border border-[var(--color-border)] bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEdit(m)}
                className={cn(
                  "flex-1 text-left text-sm truncate",
                  m.completed ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {m.title}
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(m.id)}
              aria-label="Delete milestone"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-1.5 mt-1">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add milestone"
          aria-label="New milestone title"
          className="flex-1 h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
        <button
          type="submit"
          aria-label="Add milestone"
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
