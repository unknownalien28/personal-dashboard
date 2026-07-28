import type { Goal, GoalStatus } from "@/types/models";

export interface GoalStats {
  total: number;
  completed: number;
  completionRate: number; // 0-100
  completedThisMonth: number;
  completedThisYear: number;
  overdue: number;
  overallProgress: number; // average progress across active (non-archived, non-trashed) goals
  completionStreakMonths: number;
  statusBreakdown: Record<GoalStatus, number>;
  categoryBreakdown: { category: string; count: number; avgProgress: number }[];
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // "YYYY-MM"
}

export function computeGoalStats(allGoals: Goal[]): GoalStats {
  const goals = allGoals.filter((g) => !g.deletedAt);
  const active = goals.filter((g) => !g.archived);
  const completed = active.filter((g) => g.status === "completed");
  const today = new Date().toISOString().slice(0, 10);
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisYear = new Date().getFullYear().toString();

  const overdue = active.filter(
    (g) => g.status !== "completed" && g.targetDate !== null && g.targetDate < today
  ).length;

  const overallProgress =
    active.length === 0 ? 0 : Math.round(active.reduce((sum, g) => sum + g.progress, 0) / active.length);

  const statusBreakdown: Record<GoalStatus, number> = {
    notStarted: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
  };
  for (const g of active) statusBreakdown[g.status]++;

  const categoryMap = new Map<string, { count: number; progressSum: number }>();
  for (const g of active) {
    const entry = categoryMap.get(g.category) ?? { count: 0, progressSum: 0 };
    entry.count++;
    entry.progressSum += g.progress;
    categoryMap.set(g.category, entry);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, { count, progressSum }]) => ({
      category,
      count,
      avgProgress: Math.round(progressSum / count),
    }))
    .sort((a, b) => b.count - a.count);

  // Consecutive months (ending this month) with at least one goal completed, using updatedAt as a
  // proxy for completion time since a separate completedAt timestamp isn't tracked.
  const completedMonthKeys = new Set(completed.map((g) => monthKey(g.updatedAt)));
  let completionStreakMonths = 0;
  const cursor = new Date();
  while (completedMonthKeys.has(cursor.toISOString().slice(0, 7))) {
    completionStreakMonths++;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return {
    total: active.length,
    completed: completed.length,
    completionRate: active.length === 0 ? 0 : Math.round((completed.length / active.length) * 100),
    completedThisMonth: completed.filter((g) => monthKey(g.updatedAt) === thisMonthKey).length,
    completedThisYear: completed.filter((g) => g.updatedAt.slice(0, 4) === thisYear).length,
    overdue,
    overallProgress,
    completionStreakMonths,
    statusBreakdown,
    categoryBreakdown,
  };
}
