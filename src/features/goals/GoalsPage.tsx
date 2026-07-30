import { useMemo, useRef, useState, lazy, Suspense } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGoalsStore, type GoalInput } from "@/features/goals/goals-store";
import { defaultGoalCategories } from "@/features/goals/categories";
import { GoalCard, type GoalCardMode } from "@/features/goals/components/GoalCard";
import { GoalSidebar, type GoalPrimaryFilter } from "@/features/goals/components/GoalSidebar";
import { GoalSortSelect, type GoalSort } from "@/features/goals/components/GoalSortSelect";
import { GoalKanbanBoard } from "@/features/goals/components/GoalKanbanBoard";
import { GoalDetailsPanel } from "@/features/goals/components/GoalDetailsPanel";
import { useGoalDragStatus } from "@/features/goals/useGoalDragStatus";
import { computeGoalStats } from "@/features/goals/goal-stats";
import type { Goal, GoalStatus, Priority } from "@/types/models";
import { AskAlienButton } from "@/features/ai/components/AskAlienButton";

const GoalStatsPanel = lazy(() =>
  import("@/features/goals/components/GoalStatsPanel").then((m) => ({ default: m.GoalStatsPanel }))
);

type GoalView = "grid" | "list" | "kanban" | "stats";
type PanelMode = "none" | "create" | "edit";

function sortGoals(goals: Goal[], sort: GoalSort): Goal[] {
  const list = [...goals];
  switch (sort) {
    case "progress":
      return list.sort((a, b) => b.progress - a.progress);
    case "created":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "updated":
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "alphabetical":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "targetDate":
    default:
      return list.sort((a, b) => {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return a.targetDate.localeCompare(b.targetDate);
      });
  }
}

function primaryModeFor(filter: GoalPrimaryFilter): GoalCardMode {
  if (filter === "trash") return "trash";
  if (filter === "archived") return "archived";
  return "active";
}

export function GoalsPage() {
  const {
    goals,
    customCategories,
    createGoal,
    updateGoal,
    duplicateGoal,
    archiveGoal,
    unarchiveGoal,
    softDeleteGoal,
    restoreGoal,
    permanentlyDeleteGoal,
    setManualProgress,
    setAutoProgress,
    setStatus,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleMilestone,
    addCustomCategory,
  } = useGoalsStore();

  const [view, setView] = useState<GoalView>("grid");
  const [search, setSearch] = useState("");
  const [primaryFilter, setPrimaryFilter] = useState<GoalPrimaryFilter>("active");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<Priority | null>(null);
  const [activeStatus, setActiveStatus] = useState<GoalStatus | null>(null);
  const [sort, setSort] = useState<GoalSort>("targetDate");

  const [panelMode, setPanelMode] = useState<PanelMode>("none");
  const [editingId, setEditingId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...defaultGoalCategories, ...customCategories], [customCategories]);

  const counts = useMemo(() => {
    const notTrashed = goals.filter((g) => !g.deletedAt);
    const active = notTrashed.filter((g) => !g.archived);
    return {
      active: active.filter((g) => g.status !== "completed").length,
      completed: active.filter((g) => g.status === "completed").length,
      archived: notTrashed.filter((g) => g.archived).length,
      trash: goals.filter((g) => !!g.deletedAt).length,
    };
  }, [goals]);

  const filteredGoals = useMemo(() => {
    let list = goals.filter((g) => {
      if (primaryFilter === "trash") return !!g.deletedAt;
      if (g.deletedAt) return false;
      if (primaryFilter === "archived") return g.archived;
      if (g.archived) return false;
      if (primaryFilter === "completed") return g.status === "completed";
      return g.status !== "completed";
    });

    if (activeCategory) list = list.filter((g) => g.category === activeCategory);
    if (activePriority) list = list.filter((g) => g.priority === activePriority);
    if (activeStatus) list = list.filter((g) => g.status === activeStatus);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.notes.toLowerCase().includes(q)
      );
    }

    return sortGoals(list, sort);
  }, [goals, primaryFilter, activeCategory, activePriority, activeStatus, search, sort]);

  const cardMode = primaryModeFor(primaryFilter);
  const editingGoal = useMemo(() => goals.find((g) => g.id === editingId) ?? null, [goals, editingId]);

  const drag = useGoalDragStatus((goalId, status) => setStatus(goalId, status));

  function openCreate() {
    setPanelMode("create");
    setEditingId(null);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode("none");
    setEditingId(null);
  }

  function handleSubmitCreate(values: GoalInput) {
    createGoal(values);
    closePanel();
  }

  function handleSubmitEdit(values: GoalInput) {
    if (editingId) updateGoal(editingId, values);
    closePanel();
  }

  function actionsFor(goal: Goal) {
    return {
      onArchive: cardMode === "active" ? () => archiveGoal(goal.id) : undefined,
      onUnarchive: cardMode === "archived" ? () => unarchiveGoal(goal.id) : undefined,
      onSoftDelete: cardMode !== "trash" ? () => softDeleteGoal(goal.id) : undefined,
      onRestore: cardMode === "trash" ? () => restoreGoal(goal.id) : undefined,
      onPermanentDelete: cardMode === "trash" ? () => permanentlyDeleteGoal(goal.id) : undefined,
    };
  }

  const panelOpen = panelMode !== "none";
  const activeGoalsForBoard = filteredGoals;
  const stats = computeGoalStats(goals);

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0 md:h-[calc(100vh-8.5rem)]">
      <div className="flex flex-col md:flex-row md:flex-1 gap-5 md:min-h-0">
        <div className="md:w-64 shrink-0 md:overflow-y-auto">
          <GoalSidebar
            ref={searchInputRef}
            search={search}
            onSearchChange={setSearch}
            primaryFilter={primaryFilter}
            onPrimaryFilterChange={setPrimaryFilter}
            counts={counts}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onAddCategory={addCustomCategory}
            activePriority={activePriority}
            onPriorityChange={setActivePriority}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            onCreateGoal={openCreate}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4 md:overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{counts.active}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Active goals</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{counts.completed}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Completed goals</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stats.overdue}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Overdue goals</div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stats.overallProgress}%</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Overall progress</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid" },
                { value: "list", label: "List" },
                { value: "kanban", label: "Kanban" },
                { value: "stats", label: "Stats" },
              ]}
            />
            {(view === "grid" || view === "list") && <GoalSortSelect value={sort} onChange={setSort} />}
            <AskAlienButton
              label="Suggest Next Milestone"
              prompt="Suggest the next milestone I should set for my goals."
              module="goals"
              className="hidden md:inline-flex"
            />
            <Button variant="primary" size="sm" onClick={openCreate} className="hidden md:inline-flex">
              <Plus className="h-4 w-4" /> New goal
            </Button>
          </div>

          {view === "stats" ? (
            <Suspense fallback={<RouteLoadingFallback />}>
              <GoalStatsPanel goals={goals} />
            </Suspense>
          ) : filteredGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              description={goals.length === 0 ? "No goals yet. Create your first one." : "No goals match this view."}
              action={goals.length === 0 ? { label: "Add a goal", onClick: openCreate, icon: Plus } : undefined}
              compact
            />
          ) : view === "kanban" ? (
            <GoalKanbanBoard
              goals={activeGoalsForBoard}
              onSelect={openEdit}
              activeDragId={drag.activeDragId}
              dragOverStatus={drag.dragOverStatus}
              onCardPointerDown={drag.handlePointerDown}
              onCardPointerMove={drag.handlePointerMove}
              onCardPointerUp={drag.handlePointerUp}
              consumeWasDragged={drag.consumeWasDragged}
            />
          ) : (
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" : "flex flex-col gap-2.5"}>
              {filteredGoals.map((goal, i) => (
                <div key={goal.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
                  <GoalCard
                    goal={goal}
                    mode={cardMode}
                    layout={view === "list" ? "list" : "grid"}
                    selected={goal.id === editingId}
                    onSelect={() => openEdit(goal.id)}
                    {...actionsFor(goal)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={panelOpen ? "" : "hidden md:block"}>
          <div className="md:w-80 md:shrink-0 md:border md:border-[var(--color-border)] md:rounded-xl md:p-5 md:overflow-y-auto md:h-full">
            {panelOpen ? (
              <GoalDetailsPanel
                mode={panelMode === "create" ? "create" : "edit"}
                goal={editingGoal}
                categories={categories}
                fullScreenOnMobile
                onBack={closePanel}
                onSubmitCreate={handleSubmitCreate}
                onSubmitEdit={handleSubmitEdit}
                onCancelForm={closePanel}
                onDuplicate={editingId ? () => { const id = duplicateGoal(editingId); if (id) setEditingId(id); } : undefined}
                onArchive={editingId ? () => { archiveGoal(editingId); closePanel(); } : undefined}
                onUnarchive={editingId ? () => { unarchiveGoal(editingId); closePanel(); } : undefined}
                onSoftDelete={editingId ? () => { softDeleteGoal(editingId); closePanel(); } : undefined}
                onRestore={editingId ? () => { restoreGoal(editingId); closePanel(); } : undefined}
                onPermanentDelete={editingId ? () => { permanentlyDeleteGoal(editingId); closePanel(); } : undefined}
                onAddMilestone={editingId ? (title) => addMilestone(editingId, title) : undefined}
                onToggleMilestone={editingId ? (id) => toggleMilestone(editingId, id) : undefined}
                onEditMilestone={editingId ? (id, title) => updateMilestone(editingId, id, title) : undefined}
                onDeleteMilestone={editingId ? (id) => deleteMilestone(editingId, id) : undefined}
                onManualProgress={editingId ? (progress) => setManualProgress(editingId, progress) : undefined}
                onAutoProgress={editingId ? () => setAutoProgress(editingId) : undefined}
              />
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500 border border-dashed border-[var(--color-border)] rounded-xl h-full">
                Select a goal to view details, or create a new one.
              </div>
            )}
          </div>
        </div>
      </div>

      {!panelOpen && (
        <button
          onClick={openCreate}
          aria-label="New goal"
          className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
