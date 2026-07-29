import { memo } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { computeBudgetProgress } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import type { Budget, Transaction } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface BudgetCardProps {
  budget: Budget;
  transactions: Transaction[];
  onSelect: () => void;
  onDelete: () => void;
}

const periodLabels = { weekly: "This week", monthly: "This month", yearly: "This year" };

function BudgetCardBase({ budget, transactions, onSelect, onDelete }: BudgetCardProps) {
  const progress = computeBudgetProgress(budget, transactions);
  const displayPercent = Math.min(100, Math.max(0, progress.percentage));

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onSelect} className="text-left flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{budget.category}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{periodLabels[budget.period]}</p>
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete budget"
          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-400 hover:text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-3 mb-1.5 text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatMoney(progress.spent)}</span>
        <span className="text-zinc-400 dark:text-zinc-500">of {formatMoney(budget.amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out", progress.overBudget ? "bg-danger" : "bg-accent-500")}
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {progress.remaining >= 0 ? `${formatMoney(progress.remaining)} left` : `${formatMoney(Math.abs(progress.remaining))} over`}
        </span>
        {progress.overBudget && (
          <span className="flex items-center gap-1 text-xs font-medium text-danger">
            <AlertTriangle className="h-3.5 w-3.5" /> Over budget
          </span>
        )}
      </div>
    </div>
  );
}

export const BudgetCard = memo(BudgetCardBase);
