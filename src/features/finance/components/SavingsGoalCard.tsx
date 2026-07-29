import { memo, useState } from "react";
import { Archive, ArchiveRestore, Trash2, PlusCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { financeColorConfig } from "@/features/finance/finance-color-config";
import { getSavingsIcon } from "@/features/finance/savings-icons";
import { computeSavingsEstimate } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import { useToastStore } from "@/lib/toast-store";
import type { Account, SavingsGoal } from "@/types/models";
import { cn } from "@/lib/utils/cn";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  accounts: Account[];
  onSelect: () => void;
  onContribute: (amount: number, accountId: string) => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

function SavingsGoalCardBase({ goal, accounts, onSelect, onContribute, onArchive, onUnarchive, onDelete }: SavingsGoalCardProps) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const showToast = useToastStore((s) => s.showToast);

  const Icon = getSavingsIcon(goal.icon);
  const color = financeColorConfig[goal.color];
  const percent = goal.targetAmount <= 0 ? 0 : Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const estimate = computeSavingsEstimate(goal);

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];
  if (!goal.archived && onArchive) {
    leadingActions.push({ key: "archive", label: "Archive", icon: <Archive className="h-4 w-4" />, colorClass: "bg-zinc-500", onAction: onArchive });
  }
  if (goal.archived && onUnarchive) {
    leadingActions.push({ key: "restore", label: "Restore", icon: <ArchiveRestore className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onUnarchive });
  }
  if (onDelete) {
    trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onDelete });
  }

  function handleContributeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = Number(amount);
    if (numeric > 0 && accountId) {
      onContribute(numeric, accountId);
      showToast(`Added ${formatMoney(numeric)} to "${goal.title}"`, "success");
      setAmount("");
      setContributeOpen(false);
    }
  }

  return (
    <>
      <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
        <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4", goal.archived && "opacity-60")}>
          <button onClick={onSelect} className="w-full flex items-center gap-3 text-left">
            <div className="relative shrink-0">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r={RADIUS} fill="none" strokeWidth="5" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <circle
                  cx="28"
                  cy="28"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  stroke="var(--color-accent-500)"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
              </svg>
              <div className={cn("absolute inset-0 m-2 rounded-full flex items-center justify-center", color.ringClass)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{goal.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatMoney(goal.currentAmount)} of {formatMoney(goal.targetAmount)} ({percent}%)
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {estimate.monthsRemaining === null
                  ? "Add a few contributions to see an estimate"
                  : estimate.monthsRemaining === 0
                    ? "Goal reached!"
                    : `~${estimate.monthsRemaining} mo remaining`}
              </p>
            </div>
          </button>

          {!goal.archived && accounts.length > 0 && (
            <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => setContributeOpen(true)}>
              <PlusCircle className="h-4 w-4" /> Contribute
            </Button>
          )}
        </div>
      </SwipeActions>

      <Modal open={contributeOpen} onClose={() => setContributeOpen(false)} title={`Contribute to ${goal.title}`}>
        <form onSubmit={handleContributeSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Amount</label>
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
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">From account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setContributeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Contribute
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export const SavingsGoalCard = memo(SavingsGoalCardBase);
