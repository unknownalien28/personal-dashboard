import { memo } from "react";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { goalColorConfig } from "@/features/goals/goal-color-config";
import { getGoalIcon } from "@/features/goals/goal-icons";
import { goalStatuses, goalStatusConfig } from "@/features/goals/goal-status-config";
import type { Goal, GoalStatus } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface GoalKanbanBoardProps {
  goals: Goal[];
  onSelect: (goalId: string) => void;
  activeDragId: string | null;
  dragOverStatus: GoalStatus | null;
  onCardPointerDown: (goalId: string, e: React.PointerEvent) => void;
  onCardPointerMove: (e: React.PointerEvent) => void;
  onCardPointerUp: (e: React.PointerEvent) => void;
  consumeWasDragged: () => boolean;
}

function GoalKanbanBoardBase({
  goals,
  onSelect,
  activeDragId,
  dragOverStatus,
  onCardPointerDown,
  onCardPointerMove,
  onCardPointerUp,
  consumeWasDragged,
}: GoalKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {goalStatuses.map((status) => {
        const columnGoals = goals.filter((g) => g.status === status);
        return (
          <div
            key={status}
            data-status={status}
            className={cn(
              "flex flex-col rounded-xl border border-[var(--color-border)] p-3 min-h-[200px] transition-colors duration-150",
              dragOverStatus === status && "bg-accent-50 dark:bg-accent-500/10 border-accent-400"
            )}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {goalStatusConfig[status].label}
              </h3>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">{columnGoals.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {columnGoals.map((goal) => {
                const Icon = getGoalIcon(goal.icon);
                const color = goalColorConfig[goal.color];
                return (
                  <button
                    key={goal.id}
                    onPointerDown={(e) => onCardPointerDown(goal.id, e)}
                    onPointerMove={onCardPointerMove}
                    onPointerUp={onCardPointerUp}
                    onClick={() => {
                      if (consumeWasDragged()) return;
                      onSelect(goal.id);
                    }}
                    style={{ touchAction: "none" }}
                    className={cn(
                      "text-left rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-opacity",
                      activeDragId === goal.id && "opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("h-6 w-6 shrink-0 rounded-md flex items-center justify-center", color.ringClass)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {goal.title || "Untitled goal"}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out" style={{ width: `${goal.progress}%` }} />
                    </div>
                    {goal.targetDate && (
                      <Badge tone="neutral">
                        <CalendarClock className="h-3 w-3" /> {goal.targetDate}
                      </Badge>
                    )}
                  </button>
                );
              })}
              {columnGoals.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">No goals</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const GoalKanbanBoard = memo(GoalKanbanBoardBase);
