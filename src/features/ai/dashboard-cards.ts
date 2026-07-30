import type { LucideIcon } from "lucide-react";
import { ListChecks, Gauge, Wallet, CalendarClock, Target, BarChart3, Sparkles } from "lucide-react";
import * as taskTools from "./tools/tasks-tools";
import * as goalTools from "./tools/goals-tools";
import * as calendarTools from "./tools/calendar-tools";
import * as financeTools from "./tools/finance-tools";
import * as noteTools from "./tools/notes-tools";
import { formatMoney } from "@/features/finance/format-money";
import type { ModuleKey } from "./context-engine";

export interface DashboardCard {
  id: string;
  title: string;
  icon: LucideIcon;
  tone: "info" | "warning" | "success";
  lines: string[];
  /** Clicking the card asks Alien to expand on it, with the right module context already attached. */
  prompt: string;
  module?: ModuleKey;
}

/**
 * Each card only appears when there's something real to say - an empty
 * workspace shows no cards at all rather than a wall of zeros ("Only show
 * cards when relevant" from the spec).
 */
export function generateDashboardCards(): DashboardCard[] {
  const cards: DashboardCard[] = [];

  // --- Today's Focus ---
  const openTasks = (taskTools.getTasks().data ?? []).filter((t) => !t.completed);
  const overdue = taskTools.detectOverdueTasks().data ?? [];
  if (openTasks.length > 0) {
    const top = openTasks.slice(0, 3);
    cards.push({
      id: "todays-focus",
      title: "Today's Focus",
      icon: ListChecks,
      tone: overdue.length > 0 ? "warning" : "info",
      lines: top.map((t) => `${t.title} (${t.priority})`),
      prompt: "What should I work on first?",
      module: "tasks",
    });
  }

  // --- Productivity Score (a simple 0-100 blend of completion rate + overdue penalty) ---
  const allTasks = taskTools.getTasks().data ?? [];
  if (allTasks.length >= 3) {
    const completed = allTasks.filter((t) => t.completed).length;
    const completionRate = Math.round((completed / allTasks.length) * 100);
    const penalty = Math.min(30, overdue.length * 8);
    const score = Math.max(0, completionRate - penalty);
    cards.push({
      id: "productivity-score",
      title: "Productivity Score",
      icon: Gauge,
      tone: score >= 70 ? "success" : score >= 40 ? "info" : "warning",
      lines: [`${score}/100`, `${completed} of ${allTasks.length} tasks completed`],
      prompt: "How is my productivity trending and what would raise it?",
      module: "tasks",
    });
  }

  // --- Spending Insight ---
  const weekSpend = financeTools.weekOverWeekSpending().data;
  const analysis = financeTools.analyzeFinance().data;
  if (analysis && (weekSpend?.thisWeek ?? 0) + analysis.summary.monthlyExpenses > 0) {
    const lines = [`This month: ${formatMoney(analysis.summary.monthlyExpenses)}`];
    if (weekSpend && weekSpend.percentChange !== null) {
      lines.push(`${weekSpend.percentChange > 0 ? "Up" : "Down"} ${Math.abs(weekSpend.percentChange)}% vs last week`);
    }
    if (analysis.budgetWarnings.length > 0) lines.push(`${analysis.budgetWarnings.length} budget(s) running high`);
    cards.push({
      id: "spending-insight",
      title: "Spending Insight",
      icon: Wallet,
      tone: analysis.budgetWarnings.some((b) => b.overBudget) ? "warning" : "info",
      lines,
      prompt: "Where can I save money?",
      module: "finance",
    });
  }

  // --- Upcoming Events ---
  const todayOccurrences = calendarTools.getEventsForToday().data ?? [];
  const tomorrowOccurrences = calendarTools.getEventsForTomorrow().data ?? [];
  if (todayOccurrences.length > 0 || tomorrowOccurrences.length > 0) {
    const lines = [
      ...todayOccurrences.slice(0, 2).map((o) => `Today: ${o.event.title}`),
      ...tomorrowOccurrences.slice(0, 2).map((o) => `Tomorrow: ${o.event.title}`),
    ];
    cards.push({
      id: "upcoming-events",
      title: "Upcoming Events",
      icon: CalendarClock,
      tone: "info",
      lines,
      prompt: "What does my schedule look like today and tomorrow?",
      module: "calendar",
    });
  }

  // --- Goal Progress ---
  const goalStats = goalTools.analyzeProgress().data;
  if (goalStats && goalStats.total > 0) {
    const blocked = goalTools.getBlockedGoals().data ?? [];
    cards.push({
      id: "goal-progress",
      title: "Goal Progress",
      icon: Target,
      tone: blocked.length > 0 ? "warning" : goalStats.overallProgress >= 70 ? "success" : "info",
      lines: [`${goalStats.overallProgress}% average progress`, ...(blocked.length > 0 ? [`${blocked.length} goal(s) behind schedule`] : [])],
      prompt: "What goals am I behind on?",
      module: "goals",
    });
  }

  // --- Weekly Summary (only once there's enough going on to be worth a rollup) ---
  const recentNotes = (noteTools.getNotes().data ?? []).slice(0, 3);
  if (allTasks.length > 0 || goalStats?.total || analysis) {
    cards.push({
      id: "weekly-summary",
      title: "Weekly Summary",
      icon: BarChart3,
      tone: "info",
      lines: [
        `${openTasks.length} open task(s)`,
        goalStats ? `${goalStats.total} goal(s) tracked` : null,
        analysis ? `${formatMoney(analysis.summary.monthlyExpenses)} spent this month` : null,
        recentNotes.length > 0 ? `${recentNotes.length} recent note(s)` : null,
      ].filter((line): line is string => !!line),
      prompt: "Give me a summary of my week across tasks, calendar, goals, and finances.",
    });
  }

  // --- AI Recommendations (a synthesized "what next" pulled from the sharpest signal available) ---
  const recommendation = overdue.length > 0
    ? `Clear your ${overdue.length} overdue task(s) first - they're the biggest drag on momentum.`
    : analysis?.budgetWarnings.some((b) => b.overBudget)
      ? "A budget is over its limit this month - worth a look before it compounds."
      : (goalTools.getBlockedGoals().data ?? []).length > 0
        ? "One of your goals has stalled - a small milestone could get it moving again."
        : null;
  if (recommendation) {
    cards.push({
      id: "ai-recommendation",
      title: "AI Recommendations",
      icon: Sparkles,
      tone: "info",
      lines: [recommendation],
      prompt: "What's the single most important thing I should do next?",
    });
  }

  return cards;
}
