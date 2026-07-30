import { CheckCircle2, XCircle, ShieldAlert, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ChatAction } from "@/types/models";

const TOOL_LABELS: Record<string, string> = {
  createTask: "Create task",
  updateTask: "Update task",
  completeTask: "Complete task",
  deleteTask: "Delete task",
  createNote: "Create note",
  updateNote: "Update note",
  deleteNote: "Delete note",
  createEvent: "Create event",
  updateEvent: "Update event",
  deleteEvent: "Delete event",
  createGoal: "Create goal",
  updateGoal: "Update goal",
  deleteGoal: "Delete goal",
  createTransaction: "Log transaction",
  deleteTransaction: "Delete transaction",
  deleteConversation: "Delete conversation",
};

function actionLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool;
}

interface ActionCardProps {
  action: ChatAction;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionCard({ action, onConfirm, onCancel }: ActionCardProps) {
  if (action.status === "pending") {
    return (
      <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          This will {actionLabel(action.tool).toLowerCase()} - confirm to continue.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" onClick={onConfirm} className="h-7 px-2.5 text-xs">
            Confirm
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="h-7 px-2.5 text-xs rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (action.status === "cancelled") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <Ban className="h-3.5 w-3.5" /> {action.resultMessage ?? "Cancelled."}
      </div>
    );
  }

  if (action.status === "failed") {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-danger">
        <XCircle className="h-3.5 w-3.5" /> {action.resultMessage ?? `Couldn't complete "${actionLabel(action.tool)}".`}
      </div>
    );
  }

  // "executed" or "confirmed"
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" /> {action.resultMessage ?? `${actionLabel(action.tool)} done.`}
    </div>
  );
}
