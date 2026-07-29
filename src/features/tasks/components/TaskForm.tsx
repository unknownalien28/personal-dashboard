import { useState } from "react";
import type { Priority, Task } from "@/types/models";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { useShake } from "@/hooks/useShake";
import { cn } from "@/lib/utils/cn";

export interface TaskFormValues {
  title: string;
  category: string;
  priority: Priority;
  dueDate: string | null;
}

interface TaskFormProps {
  initial?: Task;
  existingCategories: string[];
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
}

export function TaskForm({ initial, existingCategories, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const titleShake = useShake();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      titleShake.trigger();
      return;
    }
    onSubmit({
      title: title.trim(),
      category: category.trim() || "General",
      priority,
      dueDate: dueDate || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Title
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onAnimationEnd={titleShake.onAnimationEnd}
          placeholder="What needs to get done?"
          className={cn(
            "w-full h-11 rounded-lg border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400",
            titleShake.shaking ? "border-danger field-shake" : "border-[var(--color-border)]"
          )}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Priority
        </label>
        <SegmentedControl
          value={priority}
          onChange={setPriority}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Category
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="General"
            list="task-categories"
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <datalist id="task-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Add task"}
        </Button>
      </div>
    </form>
  );
}
