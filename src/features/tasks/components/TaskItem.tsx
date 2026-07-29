import { memo } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { priorityConfig } from "@/features/tasks/priority-config";
import type { Task } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDueDate(dueDate: string | null): { label: string; overdue: boolean } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return { label: "Today", overdue: false };
  if (diffDays === 1) return { label: "Tomorrow", overdue: false };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  return {
    label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    overdue: false,
  };
}

function TaskItemBase({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const due = formatDueDate(task.dueDate);
  const priority = priorityConfig[task.priority];

  return (
    <SwipeableRow onSwipeRight={onToggle} onSwipeLeft={onDelete}>
      <Card className="p-3.5 flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "h-7 w-7 md:h-6 md:w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors duration-150",
            task.completed
              ? "bg-accent-500 border-accent-500"
              : "border-zinc-300 dark:border-zinc-600 active:border-accent-400"
          )}
        >
          {task.completed && <Check className="h-4 w-4 md:h-3.5 md:w-3.5 text-white" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium truncate",
              task.completed
                ? "text-zinc-400 dark:text-zinc-500 line-through"
                : "text-zinc-900 dark:text-zinc-100"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Badge tone="neutral">{task.category}</Badge>
            <Badge tone={priority.tone}>{priority.label}</Badge>
            {due && <Badge tone={due.overdue ? "danger" : "neutral"}>{due.label}</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Edit task"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete task"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-danger hover:bg-danger/10 active:bg-danger/20 transition-colors duration-150"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </SwipeableRow>
  );
}

export const TaskItem = memo(TaskItemBase);
