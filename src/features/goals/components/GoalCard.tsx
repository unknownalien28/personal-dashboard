import { memo } from "react";
import { Archive, ArchiveRestore, Trash2, RotateCcw, XCircle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { goalColorConfig } from "@/features/goals/goal-color-config";
import { getGoalIcon } from "@/features/goals/goal-icons";
import { goalStatusConfig } from "@/features/goals/goal-status-config";
import { priorityConfig } from "@/features/tasks/priority-config";
import type { Goal } from "@/types/models";
import { cn } from "@/lib/utils/cn";

export type GoalCardMode = "active" | "archived" | "trash";

interface GoalCardProps {
  goal: Goal;
  mode: GoalCardMode;
  layout?: "grid" | "list";
  selected?: boolean;
  onSelect: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onSoftDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

function isOverdue(goal: Goal): boolean {
  if (!goal.targetDate || goal.status === "completed") return false;
  return goal.targetDate < new Date().toISOString().slice(0, 10);
}

function GoalCardBase({
  goal,
  mode,
  layout = "grid",
  selected,
  onSelect,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}: GoalCardProps) {
  const Icon = getGoalIcon(goal.icon);
  const color = goalColorConfig[goal.color];
  const overdue = isOverdue(goal);

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];

  if (mode === "active") {
    if (onArchive)
      leadingActions.push({ key: "archive", label: "Archive", icon: <Archive className="h-4 w-4" />, colorClass: "bg-zinc-500", onAction: onArchive });
    if (onSoftDelete)
      trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onSoftDelete });
  } else if (mode === "archived") {
    if (onUnarchive)
      leadingActions.push({ key: "restore", label: "Restore", icon: <ArchiveRestore className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onUnarchive });
    if (onSoftDelete)
      trailingActions.push({ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onSoftDelete });
  } else {
    if (onRestore)
      leadingActions.push({ key: "restore", label: "Restore", icon: <RotateCcw className="h-4 w-4" />, colorClass: "bg-accent-500", onAction: onRestore });
    if (onPermanentDelete)
      trailingActions.push({ key: "delete-forever", label: "Delete forever", icon: <XCircle className="h-4 w-4" />, colorClass: "bg-danger", onAction: onPermanentDelete });
  }

  return (
    <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
      <button
        onClick={onSelect}
        aria-current={selected}
        className={cn(
          "w-full text-left rounded-xl border p-4 transition-colors duration-150",
          selected
            ? "border-accent-400 bg-accent-50 dark:bg-accent-500/10"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-zinc-300 dark:hover:border-zinc-600",
          layout === "list" && "flex items-center gap-4"
        )}
      >
        <div className={cn("flex items-start gap-3", layout === "list" && "flex-1 items-center")}>
          <div className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center", color.ringClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {goal.title || "Untitled goal"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <Badge tone={goalStatusConfig[goal.status].tone}>{goalStatusConfig[goal.status].label}</Badge>
              <Badge tone={priorityConfig[goal.priority].tone}>{priorityConfig[goal.priority].label}</Badge>
              <Badge tone="neutral">{goal.category}</Badge>
              {goal.targetDate && (
                <Badge tone={overdue ? "danger" : "neutral"}>
                  <CalendarClock className="h-3 w-3" /> {goal.targetDate}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className={cn("mt-3", layout === "list" && "mt-0 w-40 shrink-0")}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Progress</span>
            <span className="text-xs font-medium text-accent-600 dark:text-accent-400">{goal.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      </button>
    </SwipeActions>
  );
}

export const GoalCard = memo(GoalCardBase);
