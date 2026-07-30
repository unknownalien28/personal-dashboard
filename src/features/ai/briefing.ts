import { differenceInMinutes } from "date-fns";
import * as taskTools from "./tools/tasks-tools";
import * as calendarTools from "./tools/calendar-tools";
import * as financeTools from "./tools/finance-tools";
import { useTasksStore } from "@/features/tasks/tasks-store";
import { formatMoney } from "@/features/finance/format-money";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * A short, personalized opening line-by-line briefing - the "instead of a
 * blank welcome page" requirement from Phase 6, Part 2. Every line comes
 * from the same local tools/stores the rest of Alien Intelligence uses;
 * nothing here calls an AI provider.
 */
export function generateBriefing(): { headline: string; lines: string[] } {
  const lines: string[] = [];

  const tasks = useTasksStore.getState().tasks;
  const completedYesterday = tasks.filter((t) => t.completed && t.createdAt.slice(0, 10) === yesterdayKey()).length;
  if (completedYesterday > 0) {
    lines.push(`You completed ${completedYesterday} task${completedYesterday === 1 ? "" : "s"} yesterday.`);
  }

  const overdue = taskTools.detectOverdueTasks().data ?? [];
  if (overdue.length > 0) {
    lines.push(`You have ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}.`);
  }

  const todayOccurrences = calendarTools.getEventsForToday().data ?? [];
  const now = new Date();
  const nextSoon = todayOccurrences
    .filter((o) => !o.event.allDay && o.occurrenceStart > now)
    .sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime())[0];
  if (nextSoon) {
    const minutes = differenceInMinutes(nextSoon.occurrenceStart, now);
    if (minutes <= 180) {
      lines.push(`"${nextSoon.event.title}" starts in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }
  }

  const savings = financeTools.savingsSuggestions().data ?? [];
  const closest = [...savings].sort((a, b) => b.progressPercent - a.progressPercent)[0];
  if (closest && closest.progressPercent > 0) {
    lines.push(`You're ${closest.progressPercent}% toward your "${closest.title}" savings goal.`);
  }

  const weekSpend = financeTools.weekOverWeekSpending().data;
  if (weekSpend && weekSpend.percentChange !== null && weekSpend.percentChange < 0) {
    lines.push(`You spent ${formatMoney(weekSpend.lastWeek - weekSpend.thisWeek)} less this week than last.`);
  }

  return { headline: greeting(), lines: lines.slice(0, 4) };
}
