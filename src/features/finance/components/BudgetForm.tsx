import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { BudgetInput } from "@/features/finance/finance-store";
import type { Budget, BudgetPeriod } from "@/types/models";

interface BudgetFormProps {
  initial?: Budget;
  categories: string[];
  onSubmit: (values: BudgetInput) => void;
  onCancel: () => void;
}

export function BudgetForm({ initial, categories, onSubmit, onCancel }: BudgetFormProps) {
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Other");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [period, setPeriod] = useState<BudgetPeriod>(initial?.period ?? "monthly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;
    onSubmit({ category, amount: numericAmount, period });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Budget amount</label>
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Period</label>
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Create budget"}
        </Button>
      </div>
    </form>
  );
}
