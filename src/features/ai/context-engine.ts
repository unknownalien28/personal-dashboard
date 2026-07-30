import { startOfDay, endOfDay, addDays } from "date-fns";
import * as taskTools from "./tools/tasks-tools";
import * as noteTools from "./tools/notes-tools";
import * as calendarTools from "./tools/calendar-tools";
import * as goalTools from "./tools/goals-tools";
import * as financeTools from "./tools/finance-tools";
import * as contentTools from "./tools/content-tools";
import { useContentStore } from "@/features/content/content-store";

export type ModuleKey = "tasks" | "notes" | "calendar" | "goals" | "finance" | "content";

const MODULE_KEYWORDS: Record<ModuleKey, string[]> = {
  tasks: ["task", "todo", "to-do", "to do", "overdue", "work on", "checklist"],
  notes: ["note", "notes", "wrote", "write up", "summarize", "summary", "meeting notes"],
  calendar: ["calendar", "event", "schedule", "meeting", "tomorrow", "today", "free time", "appointment", "agenda"],
  goals: ["goal", "goals", "milestone", "habit", "progress", "behind on"],
  finance: ["spend", "spent", "spending", "budget", "money", "expense", "income", "savings", "save money", "transaction", "balance"],
  content: ["content", "post", "caption", "hashtag", "campaign", "publish", "social media", "draft", "platform"],
};

/** Cheap keyword-based intent detection - deliberately simple and fast, no model round-trip required to decide what to load. */
export function detectRelevantModules(message: string): ModuleKey[] {
  const text = message.toLowerCase();
  const found = (Object.keys(MODULE_KEYWORDS) as ModuleKey[]).filter((key) =>
    MODULE_KEYWORDS[key].some((kw) => text.includes(kw))
  );

  const wantsBroadSummary = /\b(weekly|week in review|overview|summary of everything|how am i doing|catch me up)\b/.test(text);
  if (wantsBroadSummary) return ["tasks", "calendar", "goals", "finance", "content"];

  return found;
}

function formatTasksContext(): string {
  const tasks = taskTools.getTasks().data ?? [];
  const overdue = taskTools.detectOverdueTasks().data ?? [];
  const active = tasks.filter((t) => !t.completed).slice(0, 12);
  const lines = active.map((t) => `- [${t.priority}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}${t.completed ? " ✓" : ""}`);
  return [`Tasks (${tasks.length} total, ${overdue.length} overdue):`, ...lines].join("\n");
}

function formatNotesContext(message: string): string {
  const words = message
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !MODULE_KEYWORDS.notes.includes(w));
  const query = words[0] ?? "";
  const notes = (query ? noteTools.searchNotes(query).data : noteTools.getNotes().data) ?? [];
  const lines = notes.slice(0, 6).map((n) => `- "${n.title || "Untitled"}" (updated ${n.updatedAt.slice(0, 10)})`);
  return [`Notes${query ? ` matching "${query}"` : ""} (${notes.length} found):`, ...lines].join("\n");
}

function formatCalendarContext(message: string): string {
  const text = message.toLowerCase();
  const isTomorrow = text.includes("tomorrow");
  const range = isTomorrow
    ? { start: startOfDay(addDays(new Date(), 1)), end: endOfDay(addDays(new Date(), 1)) }
    : { start: startOfDay(new Date()), end: endOfDay(addDays(new Date(), 7)) };
  const occurrences = calendarTools.getEvents(range.start, range.end).data ?? [];
  const lines = occurrences
    .slice(0, 10)
    .map((o) => `- ${o.event.title} (${o.occurrenceStart.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: o.event.allDay ? undefined : "numeric", minute: o.event.allDay ? undefined : "2-digit" })})`);
  return [`Calendar - ${isTomorrow ? "tomorrow" : "next 7 days"} (${occurrences.length} event(s)):`, ...lines].join("\n");
}

function formatGoalsContext(): string {
  const goals = goalTools.getGoals().data ?? [];
  const blocked = goalTools.getBlockedGoals().data ?? [];
  const lines = goals.slice(0, 10).map((g) => `- ${g.title}: ${g.progress}% (${g.status})`);
  return [`Goals (${goals.length} total, ${blocked.length} behind schedule):`, ...lines].join("\n");
}

function formatFinanceContext(): string {
  const analysis = financeTools.analyzeFinance().data;
  if (!analysis) return "Finance: no data available.";
  const { summary, topCategories, budgetWarnings } = analysis;
  const lines = [
    `Total balance: $${summary.totalBalance.toFixed(2)}`,
    `This month: $${summary.monthlyIncome.toFixed(2)} in, $${summary.monthlyExpenses.toFixed(2)} out`,
    ...topCategories.map((c) => `- ${c.category}: $${c.total.toFixed(2)}`),
    ...budgetWarnings.map((b) => `⚠ Budget "${b.category}" at ${b.percentage}%${b.overBudget ? " (over budget)" : ""}`),
  ];
  return ["Finance:", ...lines].join("\n");
}

function formatContentContext(): string {
  const activeId = useContentStore.getState().activeEditingId;
  const posts = contentTools.getContent().data ?? [];

  if (activeId) {
    const active = posts.find((p) => p.id === activeId);
    if (active) {
      return [
        `Active content document (the one currently open in the workspace):`,
        `Title: ${active.title}`,
        `Platform: ${active.platform}`,
        `Status: ${active.status}`,
        `Hashtags: ${active.hashtags.join(", ") || "none"}`,
        `Body:\n${active.body || "(empty)"}`,
      ].join("\n");
    }
  }

  const lines = posts.slice(0, 10).map((p) => `- [${p.status}] ${p.title} (${p.platform}${p.publishDate ? `, ${p.publishDate}` : ""})`);
  return [`Content Planner (${posts.length} item(s)):`, ...lines].join("\n");
}

/**
 * Builds a compact, plain-text context block containing only the modules
 * relevant to `message` - the privacy/token-discipline requirement from the
 * spec - plus any `forceModules` the caller already knows are relevant (e.g.
 * "the user is currently on the Finance page"). Returns an empty string when
 * nothing applies, so a purely conversational message never leaks workspace
 * data at all.
 */
export function buildContext(message: string, forceModules: ModuleKey[] = []): { modules: ModuleKey[]; text: string } {
  const detected = detectRelevantModules(message);
  const modules = Array.from(new Set([...detected, ...forceModules]));
  if (modules.length === 0) return { modules, text: "" };

  const sections: string[] = [];
  if (modules.includes("tasks")) sections.push(formatTasksContext());
  if (modules.includes("notes")) sections.push(formatNotesContext(message));
  if (modules.includes("calendar")) sections.push(formatCalendarContext(message));
  if (modules.includes("goals")) sections.push(formatGoalsContext());
  if (modules.includes("finance")) sections.push(formatFinanceContext());
  if (modules.includes("content")) sections.push(formatContentContext());

  return { modules, text: sections.join("\n\n") };
}
