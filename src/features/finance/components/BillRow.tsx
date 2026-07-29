import { memo } from "react";
import { Check, Archive, ArchiveRestore, Trash2, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { formatMoney } from "@/features/finance/format-money";
import type { Bill } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface BillRowProps {
  bill: Bill;
  onSelect: () => void;
  onTogglePaid: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function BillRowBase({ bill, onSelect, onTogglePaid, onArchive, onUnarchive, onDelete }: BillRowProps) {
  const diff = daysUntil(bill.dueDate);
  const overdue = !bill.paid && diff < 0;

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];
  if (!bill.archived && onArchive) {
    leadingActions.push({ key: "archive", label: "Archive", icon: <Archive className="h-4 w-4" />, colorClass: "bg-zinc-500", onAction: onArchive });
  }
  if (bill.archived && onUnarchive) {
    leadingActions.push({ key: "restore", label: "Restore", icon: <ArchiveRestore className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onUnarchive });
  }
  if (onDelete) {
    trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onDelete });
  }

  return (
    <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
      <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 flex items-center gap-3", bill.archived && "opacity-60")}>
        <button
          onClick={onTogglePaid}
          aria-label={bill.paid ? "Mark unpaid" : "Mark paid"}
          className={cn(
            "h-7 w-7 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-150",
            bill.paid ? "bg-success border-success" : "border-zinc-300 dark:border-zinc-600"
          )}
        >
          {bill.paid && <Check className="h-4 w-4 text-white" />}
        </button>

        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{bill.name}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge tone="neutral">{bill.category}</Badge>
            {bill.autoRepeat !== "none" && (
              <Badge tone="accent">
                <Repeat className="h-3 w-3" /> {bill.autoRepeat}
              </Badge>
            )}
            <Badge tone={overdue ? "danger" : bill.paid ? "success" : "neutral"}>
              {bill.paid ? "Paid" : overdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `Due in ${diff}d`}
            </Badge>
          </div>
        </button>

        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums shrink-0">{formatMoney(bill.amount)}</p>
      </div>
    </SwipeActions>
  );
}

export const BillRow = memo(BillRowBase);
