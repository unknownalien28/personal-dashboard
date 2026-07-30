import { useGoalsStore, type GoalInput } from "@/features/goals/goals-store";
import { computeGoalStats } from "@/features/goals/goal-stats";
import { ok, fail, type ToolResult } from "./types";
import type { Goal } from "@/types/models";

function activeGoals(): Goal[] {
  return useGoalsStore.getState().goals.filter((g) => !g.deletedAt && !g.archived);
}

function findByTitle(query: string): Goal | undefined {
  const q = query.trim().toLowerCase();
  return activeGoals().find((g) => g.title.toLowerCase().includes(q));
}

export function getGoals(): ToolResult<Goal[]> {
  const goals = activeGoals();
  return ok(`Found ${goals.length} goal(s).`, goals);
}

/** Goals that are in progress but past their target date, or stuck at 0% with a target date already close. */
export function getBlockedGoals(): ToolResult<Goal[]> {
  const today = new Date().toISOString().slice(0, 10);
  const blocked = activeGoals().filter((g) => {
    if (g.status === "completed") return false;
    if (g.status === "onHold") return true;
    if (g.targetDate && g.targetDate < today) return true;
    return false;
  });
  return ok(`${blocked.length} goal(s) behind schedule or blocked.`, blocked);
}

export function analyzeProgress(): ToolResult<ReturnType<typeof computeGoalStats>> {
  const stats = computeGoalStats(useGoalsStore.getState().goals);
  return ok(`Overall progress: ${stats.overallProgress}% across ${stats.total} goal(s).`, stats);
}

export function createGoal(input: GoalInput): ToolResult<{ id: string }> {
  if (!input.title?.trim()) return fail("A goal needs a title.");
  const id = useGoalsStore.getState().createGoal(input);
  return ok(`Created goal "${input.title}".`, { id });
}

export function updateGoal(idOrTitle: string, updates: Partial<GoalInput>): ToolResult<{ id: string }> {
  const goal = activeGoals().find((g) => g.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!goal) return fail(`Couldn't find a goal matching "${idOrTitle}".`);
  useGoalsStore.getState().updateGoal(goal.id, updates);
  return ok(`Updated "${goal.title}".`, { id: goal.id });
}

export function deleteGoal(idOrTitle: string): ToolResult<{ id: string }> {
  const goal = activeGoals().find((g) => g.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!goal) return fail(`Couldn't find a goal matching "${idOrTitle}".`);
  useGoalsStore.getState().softDeleteGoal(goal.id);
  return ok(`Moved "${goal.title}" to Trash.`, { id: goal.id });
}

/** Heuristic milestone suggestions - breaks a goal down into a generic plan/execute/review arc when it has none yet. */
export function suggestMilestones(idOrTitle: string): ToolResult<string[]> {
  const goal = activeGoals().find((g) => g.id === idOrTitle) ?? findByTitle(idOrTitle);
  const title = goal?.title ?? idOrTitle;
  if (goal && goal.milestones.length > 0) {
    const remaining = goal.milestones.filter((m) => !m.completed).map((m) => m.title);
    return ok(`${remaining.length} remaining milestone(s) for "${title}".`, remaining);
  }
  const suggestions = [`Define what "done" looks like for ${title}`, `Break ${title} into weekly checkpoints`, `Review progress on ${title}`];
  return ok(`Suggested ${suggestions.length} milestone(s) for "${title}".`, suggestions);
}
