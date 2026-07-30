import * as taskTools from "./tools/tasks-tools";
import * as goalTools from "./tools/goals-tools";
import * as calendarTools from "./tools/calendar-tools";
import * as financeTools from "./tools/finance-tools";
import { formatMoney } from "@/features/finance/format-money";

export interface Insight {
  id: string;
  text: string;
  tone: "info" | "warning" | "success";
}

/**
 * Computes a small set of proactive, workspace-aware observations - the kind
 * a human assistant would open with. Pure and synchronous: no AI provider
 * call is needed since every number here already lives in a store.
 */
export function generateInsights(): Insight[] {
  const insights: Insight[] = [];

  const overdue = taskTools.detectOverdueTasks().data ?? [];
  if (overdue.length > 0) {
    insights.push({ id: "overdue-tasks", text: `You have ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}.`, tone: "warning" });
  }

  const tomorrow = calendarTools.getEventsForTomorrow().data ?? [];
  if (tomorrow.length === 0) {
    insights.push({ id: "no-events-tomorrow", text: "You have no calendar events tomorrow.", tone: "info" });
  }

  const blockedGoals = goalTools.getBlockedGoals().data ?? [];
  if (blockedGoals.length > 0) {
    insights.push({
      id: "blocked-goals",
      text: `${blockedGoals.length} goal${blockedGoals.length === 1 ? " is" : "s are"} behind schedule.`,
      tone: "warning",
    });
  } else {
    const stats = goalTools.analyzeProgress().data;
    if (stats && stats.total > 0 && stats.overallProgress >= 75) {
      insights.push({ id: "goals-on-track", text: `You're at ${stats.overallProgress}% average progress across your goals - great pace.`, tone: "success" });
    }
  }

  const weekSpend = financeTools.weekOverWeekSpending().data;
  if (weekSpend && weekSpend.percentChange !== null && Math.abs(weekSpend.percentChange) >= 10) {
    const direction = weekSpend.percentChange > 0 ? "increased" : "decreased";
    insights.push({
      id: "spending-change",
      text: `Your spending ${direction} ${Math.abs(weekSpend.percentChange)}% this week (${formatMoney(weekSpend.thisWeek)} vs ${formatMoney(weekSpend.lastWeek)}).`,
      tone: weekSpend.percentChange > 0 ? "warning" : "success",
    });
  }

  const savings = financeTools.savingsSuggestions().data ?? [];
  const aheadGoal = savings.find((g) => g.progressPercent >= 80 && g.progressPercent < 100);
  if (aheadGoal) {
    insights.push({ id: "savings-close", text: `You're close to completing your "${aheadGoal.title}" savings goal (${aheadGoal.progressPercent}%).`, tone: "success" });
  }

  return insights.slice(0, 4);
}
