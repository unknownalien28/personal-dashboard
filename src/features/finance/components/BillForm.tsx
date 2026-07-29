import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BillInput } from "@/features/finance/finance-store";
import type { Bill, ReminderOption, RepeatOption } from "@/types/models";

const reminderLabels: Record<ReminderOption, string> = {
  none: "No reminder",
  atTime: "On due date",
  "5min": "5 minutes before",
  "15min": "15 minutes before",
  "30min": "30 minutes before",
  "1hour": "1 hour before",
  "1day": "1 day before",
};

const repeatLabels: Record<RepeatOption, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

interface BillFormProps {
  initial?: Bill;
  categories: string[];
  onSubmit: (values: BillInput) => void;
  onCancel: () => void;
}

export function BillForm({ initial, categories, onSubmit, onCancel }: BillFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Bills");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [reminder, setReminder] = useState<ReminderOption>(initial?.reminder ?? "1day");
  const [autoRepeat, setAutoRepeat] = useState<RepeatOption>(initial?.autoRepeat ?? "monthly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!name.trim() || !numericAmount || numericAmount <= 0) return;
    onSubmit({ name: name.trim(), category, amount: numericAmount, dueDate, reminder, autoRepeat });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Bill name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rent, Internet, Netflix"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
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
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Due date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Reminder</label>
          <select
            value={reminder}
            onChange={(e) => setReminder(e.target.value as ReminderOption)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {(Object.keys(reminderLabels) as ReminderOption[]).map((r) => (
              <option key={r} value={r}>
                {reminderLabels[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Auto-repeat</label>
          <select
            value={autoRepeat}
            onChange={(e) => setAutoRepeat(e.target.value as RepeatOption)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {(Object.keys(repeatLabels) as RepeatOption[]).map((r) => (
              <option key={r} value={r}>
                {repeatLabels[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Add bill"}
        </Button>
      </div>
    </form>
  );
}
