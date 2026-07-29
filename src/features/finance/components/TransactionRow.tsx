import { memo } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Star, Paperclip, Repeat, Archive, Trash2, ArchiveRestore, Copy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { formatMoney } from "@/features/finance/format-money";
import type { Account, Transaction } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface TransactionRowProps {
  transaction: Transaction;
  account: Account | undefined;
  transferAccount: Account | undefined;
  onSelect: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

const typeConfig = {
  income: { icon: ArrowDownLeft, tone: "text-success", sign: "+" },
  expense: { icon: ArrowUpRight, tone: "text-danger", sign: "-" },
  transfer: { icon: ArrowLeftRight, tone: "text-accent-500", sign: "" },
} as const;

function TransactionRowBase({ transaction, account, transferAccount, onSelect, onDuplicate, onArchive, onUnarchive, onDelete }: TransactionRowProps) {
  const { icon: Icon, tone, sign } = typeConfig[transaction.type];

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];
  if (!transaction.archived && onArchive) {
    leadingActions.push({ key: "archive", label: "Archive", icon: <Archive className="h-4 w-4" />, colorClass: "bg-zinc-500", onAction: onArchive });
  }
  if (transaction.archived && onUnarchive) {
    leadingActions.push({ key: "restore", label: "Restore", icon: <ArchiveRestore className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onUnarchive });
  }
  if (onDelete) {
    trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onDelete });
  }

  return (
    <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 flex items-center gap-3 cursor-pointer",
          "hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
          transaction.archived && "opacity-60"
        )}
      >
        <div className={cn("h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800", tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {transaction.favorite && <Star className="h-3 w-3 text-warning shrink-0 fill-current" />}
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {transaction.type === "transfer"
                ? `${account?.name ?? "Unknown"} \u2192 ${transferAccount?.name ?? "Unknown"}`
                : transaction.category}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge tone="neutral">{account?.name ?? "Unknown account"}</Badge>
            {transaction.recurring && (
              <Badge tone="accent">
                <Repeat className="h-3 w-3" /> Recurring
              </Badge>
            )}
            {transaction.hasReceipt && <Paperclip className="h-3 w-3 text-zinc-400" aria-label="Has receipt" />}
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-1.5">
          <div>
            <p className={cn("text-sm font-semibold tabular-nums", tone)}>
              {sign}
              {formatMoney(transaction.amount, account?.currency)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{transaction.date}</p>
          </div>
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              aria-label="Duplicate transaction"
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </SwipeActions>
  );
}

export const TransactionRow = memo(TransactionRowBase);
