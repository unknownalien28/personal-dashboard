import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { goalColors, goalColorConfig } from "@/features/goals/goal-color-config";
import { goalIconKeys, goalIconMap, goalIconLabels } from "@/features/goals/goal-icons";
import { goalStatuses, goalStatusConfig } from "@/features/goals/goal-status-config";
import type { GoalInput } from "@/features/goals/goals-store";
import type { Goal, Priority, GoalStatus } from "@/types/models";
import { useShake } from "@/hooks/useShake";
import { cn } from "@/lib/utils/cn";

interface GoalFormProps {
  initial?: Goal;
  categories: string[];
  onSubmit: (values: GoalInput) => void;
  onCancel: () => void;
}

export function GoalForm({ initial, categories, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const titleShake = useShake();
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Other");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? "notStarted");
  const [color, setColor] = useState(initial?.color ?? "default");
  const [icon, setIcon] = useState(initial?.icon ?? "target");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      titleShake.trigger();
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      targetDate: targetDate || null,
      status,
      color,
      icon,
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onAnimationEnd={titleShake.onAnimationEnd}
          placeholder="What do you want to achieve?"
          className={cn(
            "w-full h-11 rounded-lg border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400",
            titleShake.shaking ? "border-danger field-shake" : "border-[var(--color-border)]"
          )}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does success look like?"
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {goalIconKeys.map((key) => {
            const Icon = goalIconMap[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={goalIconLabels[key]}
                aria-pressed={icon === key}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-lg border transition-colors duration-150",
                  icon === key
                    ? "border-accent-400 bg-accent-50 text-accent-600 dark:bg-accent-500/15 dark:text-accent-400"
                    : "border-[var(--color-border)] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Color</label>
        <div className="flex items-center gap-2">
          {goalColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`${goalColorConfig[c].label} color`}
              aria-pressed={color === c}
              className={cn(
                "h-7 w-7 rounded-full transition-transform",
                goalColorConfig[c].swatchClass,
                color === c && "ring-2 ring-offset-2 ring-accent-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Priority</label>
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

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Status</label>
        <SegmentedControl
          value={status}
          onChange={setStatus}
          options={goalStatuses.map((s) => ({ value: s, label: goalStatusConfig[s].label }))}
          className="w-full flex-wrap"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other details..."
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
}
