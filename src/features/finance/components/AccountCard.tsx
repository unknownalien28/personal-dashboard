import { memo } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { financeColorConfig } from "@/features/finance/finance-color-config";
import { accountTypeConfig } from "@/features/finance/account-config";
import { formatMoney } from "@/features/finance/format-money";
import type { Account } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface AccountCardProps {
  account: Account;
  onSelect: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

function AccountCardBase({ account, onSelect, onArchive, onUnarchive, onDelete }: AccountCardProps) {
  const Icon = accountTypeConfig[account.type].icon;
  const color = financeColorConfig[account.color];

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];
  if (!account.archived && onArchive) {
    leadingActions.push({ key: "archive", label: "Archive", icon: <Archive className="h-4 w-4" />, colorClass: "bg-zinc-500", onAction: onArchive });
  }
  if (account.archived && onUnarchive) {
    leadingActions.push({ key: "restore", label: "Restore", icon: <ArchiveRestore className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onUnarchive });
  }
  if (onDelete) {
    trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onDelete });
  }

  return (
    <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
      <button
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-xl border p-4 transition-colors duration-150",
          "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-zinc-300 dark:hover:border-zinc-600",
          account.archived && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center", color.ringClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{account.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{accountTypeConfig[account.type].label}</p>
          </div>
        </div>
        <p
          className={cn(
            "text-xl font-semibold mt-3 tabular-nums",
            account.balance < 0 ? "text-danger" : "text-zinc-900 dark:text-zinc-100"
          )}
        >
          {formatMoney(account.balance, account.currency)}
        </p>
      </button>
    </SwipeActions>
  );
}

export const AccountCard = memo(AccountCardBase);
