import { ArrowLeft, Copy, Archive, ArchiveRestore, Trash2, RotateCcw, XCircle, RefreshCw } from "lucide-react";
import { GoalForm } from "@/features/goals/components/GoalForm";
import { MilestoneList } from "@/features/goals/components/MilestoneList";
import type { GoalInput } from "@/features/goals/goals-store";
import type { Goal } from "@/types/models";
import { cn } from "@/lib/utils/cn";

type PanelMode = "create" | "edit";

interface GoalDetailsPanelProps {
  mode: PanelMode;
  goal: Goal | null;
  categories: string[];
  fullScreenOnMobile?: boolean;
  onBack: () => void;
  onSubmitCreate: (values: GoalInput) => void;
  onSubmitEdit: (values: GoalInput) => void;
  onCancelForm: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onSoftDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
  onAddMilestone?: (title: string) => void;
  onToggleMilestone?: (id: string) => void;
  onEditMilestone?: (id: string, title: string) => void;
  onDeleteMilestone?: (id: string) => void;
  onManualProgress?: (progress: number) => void;
  onAutoProgress?: () => void;
}

export function GoalDetailsPanel({
  mode,
  goal,
  categories,
  fullScreenOnMobile,
  onBack,
  onSubmitCreate,
  onSubmitEdit,
  onCancelForm,
  onDuplicate,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
  onAddMilestone,
  onToggleMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onManualProgress,
  onAutoProgress,
}: GoalDetailsPanelProps) {
  const isTrash = goal?.deletedAt != null;
  const isArchived = !isTrash && goal?.archived;

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--color-canvas)] md:bg-transparent",
        fullScreenOnMobile && "fixed inset-0 z-40 md:relative md:inset-auto md:z-auto"
      )}
      role="region"
      aria-label="Goal details"
    >
      <div className="flex items-center gap-1 px-3 md:px-0 h-14 md:h-auto md:pb-3 border-b md:border-b-0 border-[var(--color-border)] pt-[env(safe-area-inset-top)] md:pt-0 shrink-0">
        <button
          onClick={onBack}
          aria-label="Back"
          className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-2">
          {mode === "create" ? "New goal" : "Edit goal"}
        </h2>

        {mode === "edit" && goal && (
          <div className="flex items-center gap-0.5">
            {!isTrash && onDuplicate && (
              <button
                onClick={onDuplicate}
                aria-label="Duplicate goal"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Copy className="h-[18px] w-[18px]" />
              </button>
            )}
            {!isTrash && !isArchived && onArchive && (
              <button
                onClick={onArchive}
                aria-label="Archive goal"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Archive className="h-[18px] w-[18px]" />
              </button>
            )}
            {!isTrash && isArchived && onUnarchive && (
              <button
                onClick={onUnarchive}
                aria-label="Restore from archive"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArchiveRestore className="h-[18px] w-[18px]" />
              </button>
            )}
            {!isTrash && onSoftDelete && (
              <button
                onClick={onSoftDelete}
                aria-label="Move goal to trash"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            )}
            {isTrash && onRestore && (
              <button
                onClick={onRestore}
                aria-label="Restore goal"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            )}
            {isTrash && onPermanentDelete && (
              <button
                onClick={onPermanentDelete}
                aria-label="Delete goal forever"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <XCircle className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-3 pb-[env(safe-area-inset-bottom)]">
        {mode === "create" && <GoalForm categories={categories} onSubmit={onSubmitCreate} onCancel={onCancelForm} />}

        {mode === "edit" && goal && (
          <div className="flex flex-col gap-5">
            {!isTrash && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Progress {goal.manualProgress && <span className="text-accent-500">(manual)</span>}
                  </label>
                  {goal.manualProgress && onAutoProgress && (
                    <button
                      onClick={onAutoProgress}
                      className="flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" /> Recalculate from milestones
                    </button>
                  )}
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={(e) => onManualProgress?.(Number(e.target.value))}
                  aria-label="Goal progress percentage"
                  className="w-full accent-accent-500"
                />
                <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{goal.progress}%</div>
              </div>
            )}

            {!isTrash && (
              <div>
                <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Milestones</h3>
                <MilestoneList
                  milestones={goal.milestones}
                  onAdd={(title) => onAddMilestone?.(title)}
                  onToggle={(id) => onToggleMilestone?.(id)}
                  onEdit={(id, title) => onEditMilestone?.(id, title)}
                  onDelete={(id) => onDeleteMilestone?.(id)}
                />
              </div>
            )}

            {isTrash ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{goal.title || "Untitled goal"}</span> is
                in Trash. Restore it to continue editing, or delete it permanently.
              </p>
            ) : (
              <GoalForm initial={goal} categories={categories} onSubmit={onSubmitEdit} onCancel={onCancelForm} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
