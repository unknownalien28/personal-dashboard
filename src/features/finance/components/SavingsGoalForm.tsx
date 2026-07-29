import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { financeColors, financeColorConfig } from "@/features/finance/finance-color-config";
import { savingsIconKeys, savingsIconMap, savingsIconLabels } from "@/features/finance/savings-icons";
import type { SavingsGoalInput } from "@/features/finance/finance-store";
import type { NoteColor, SavingsGoal } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface SavingsGoalFormProps {
  initial?: SavingsGoal;
  onSubmit: (values: SavingsGoalInput) => void;
  onCancel: () => void;
}

export function SavingsGoalForm({ initial, onSubmit, onCancel }: SavingsGoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [color, setColor] = useState<NoteColor>(initial?.color ?? "default");
  const [icon, setIcon] = useState(initial?.icon ?? "target");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericTarget = Number(targetAmount);
    if (!title.trim() || !numericTarget || numericTarget <= 0) return;
    onSubmit({ title: title.trim(), targetAmount: numericTarget, deadline: deadline || null, color, icon });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Goal name</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Emergency Fund, Trip to Japan"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {savingsIconKeys.map((key) => {
            const Icon = savingsIconMap[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                aria-label={savingsIconLabels[key]}
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
          {financeColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`${financeColorConfig[c].label} color`}
              aria-pressed={color === c}
              className={cn(
                "h-7 w-7 rounded-full transition-transform",
                financeColorConfig[c].swatchClass,
                color === c && "ring-2 ring-offset-2 ring-accent-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Target amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Deadline (optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
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
