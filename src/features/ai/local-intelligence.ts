import { addDays } from "date-fns";
import * as taskTools from "./tools/tasks-tools";
import * as noteTools from "./tools/notes-tools";
import * as calendarTools from "./tools/calendar-tools";
import * as goalTools from "./tools/goals-tools";
import * as financeTools from "./tools/finance-tools";
import { universalSearch } from "./universal-search";
import { formatMoney } from "@/features/finance/format-money";

export interface LocalReply {
  text: string;
  /** Matches the `alienos-action` block convention so it flows through the exact same action-protocol path as a real provider's response. */
  actionBlock?: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseDueDate(text: string): string | null {
  const t = text.toLowerCase();
  if (/\btoday\b/.test(t)) return toISODate(new Date());
  if (/\btomorrow\b/.test(t)) return toISODate(addDays(new Date(), 1));
  for (let i = 0; i < 7; i++) {
    if (t.includes(WEEKDAYS[i])) {
      const d = new Date();
      const diff = (i - d.getDay() + 7) % 7 || 7;
      return toISODate(addDays(d, diff));
    }
  }
  return null;
}

function actionBlock(tool: string, args: Record<string, unknown>): string {
  return "```alienos-action\n" + JSON.stringify({ tool, args }) + "\n```";
}

/** Best-effort local NLU over a handful of common intents, so Demo mode is a genuine (if limited) working assistant with zero setup. */
export function respondLocally(message: string): LocalReply {
  const t = message.trim();
  const lower = t.toLowerCase();

  // --- Create task ---
  if (/^(create|add|new)\s+(a\s+)?task\b/.test(lower) || /remind me to\b/.test(lower)) {
    const dueDate = parseDueDate(lower);
    let title = t
      .replace(/^(create|add|new)\s+(a\s+)?task\b\s*(to|:)?/i, "")
      .replace(/remind me to/i, "")
      .replace(/\b(today|tomorrow|on\s+\w+day)\b/gi, "")
      .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!title) title = "New task";
    const timeNote = /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i.exec(lower)?.[0];
    return {
      text: `Sure - creating "${title}"${dueDate ? ` due ${dueDate}` : ""}.${
        timeNote ? " Heads up: tasks only track a due *date* right now, not a specific time, so I've left that part off." : ""
      }`,
      actionBlock: actionBlock("createTask", { title, dueDate }),
    };
  }

  // --- Complete task ---
  const completeMatch = lower.match(/(complete|finish|done with|mark)\s+(my\s+)?(.+?)\s*(task)?$/);
  if (completeMatch && (lower.startsWith("complete") || lower.startsWith("finish") || lower.startsWith("mark"))) {
    const query = completeMatch[3].replace(/\bas\s+(done|complete)\b/gi, "").trim();
    const result = taskTools.completeTask(query);
    return { text: result.message };
  }

  // --- What should I work on ---
  if (/what should i work on|what's next|top priorit/i.test(lower)) {
    const tasks = (taskTools.getTasks().data ?? []).filter((task) => !task.completed).slice(0, 3);
    if (tasks.length === 0) return { text: "You're all caught up - no open tasks right now." };
    const lines = tasks.map((task, i) => `${i + 1}. **${task.title}** (${task.priority} priority${task.dueDate ? `, due ${task.dueDate}` : ""})`);
    return { text: `Here's what I'd tackle first:\n\n${lines.join("\n")}` };
  }

  // --- Overdue ---
  if (/overdue/.test(lower)) {
    const overdue = taskTools.detectOverdueTasks().data ?? [];
    if (overdue.length === 0) return { text: "Nothing overdue - you're on track!" };
    return { text: `You have ${overdue.length} overdue task(s):\n\n${overdue.map((task) => `- ${task.title} (was due ${task.dueDate})`).join("\n")}` };
  }

  // --- Notes: summarize / find ---
  if (/summarize|summary/.test(lower) && /note/.test(lower)) {
    const query = lower.replace(/summarize|summary|my|notes?|about|on/gi, "").trim();
    const summaries = noteTools.summarizeNotes(query).data ?? [];
    if (summaries.length === 0) return { text: `I couldn't find notes${query ? ` matching "${query}"` : ""} to summarize.` };
    const lines = summaries.map(({ note, preview }) => `**${note.title || "Untitled"}**\n${preview || "(empty)"}`);
    return { text: lines.join("\n\n") };
  }
  if (/find|search/.test(lower) && /note/.test(lower)) {
    const query = lower.replace(/find|search|my|notes?|for/gi, "").trim();
    const notes = noteTools.searchNotes(query).data ?? [];
    if (notes.length === 0) return { text: `No notes found${query ? ` matching "${query}"` : ""}.` };
    return { text: `Found ${notes.length} note(s):\n\n${notes.slice(0, 5).map((n) => `- ${n.title || "Untitled"}`).join("\n")}` };
  }

  // --- Calendar: tomorrow / today ---
  if (/tomorrow/.test(lower) && /(look like|schedule|calendar|events?)/.test(lower)) {
    const occurrences = calendarTools.getEventsForTomorrow().data ?? [];
    if (occurrences.length === 0) return { text: "You have no calendar events tomorrow - a clean slate!" };
    const lines = occurrences.map((o) => `- ${o.event.title} at ${o.event.allDay ? "all day" : o.occurrenceStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    return { text: `Tomorrow:\n\n${lines.join("\n")}` };
  }
  if (/today/.test(lower) && /(look like|schedule|calendar|events?)/.test(lower)) {
    const occurrences = calendarTools.getEventsForToday().data ?? [];
    if (occurrences.length === 0) return { text: "Nothing on your calendar today." };
    const lines = occurrences.map((o) => `- ${o.event.title} at ${o.event.allDay ? "all day" : o.occurrenceStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    return { text: `Today:\n\n${lines.join("\n")}` };
  }

  // --- Goals behind schedule ---
  if (/goals?.*(behind|blocked|stuck)/.test(lower) || /behind on/.test(lower)) {
    const blocked = goalTools.getBlockedGoals().data ?? [];
    if (blocked.length === 0) return { text: "None of your goals are behind schedule right now - nice work." };
    return { text: `${blocked.length} goal(s) need attention:\n\n${blocked.map((g) => `- ${g.title} (${g.progress}%, ${g.status})`).join("\n")}` };
  }

  // --- Finance: spending / savings ---
  if (/how much.*(spend|spent)|spending this month/.test(lower)) {
    const analysis = financeTools.analyzeFinance().data;
    if (!analysis) return { text: "I don't have any finance data to work with yet." };
    return {
      text: `You've spent ${formatMoney(analysis.summary.monthlyExpenses)} this month across ${analysis.topCategories.length} categories. Top: ${analysis.topCategories
        .slice(0, 3)
        .map((c) => `${c.category} (${formatMoney(c.total)})`)
        .join(", ") || "—"}.`,
    };
  }
  if (/where can i save|save money|reduce spending/.test(lower)) {
    const analysis = financeTools.analyzeFinance().data;
    if (!analysis || analysis.topCategories.length === 0) return { text: "Not enough transaction history yet to spot savings opportunities." };
    const top = analysis.topCategories[0];
    return {
      text: `Your biggest expense category is **${top.category}** at ${formatMoney(top.total)} this month${
        analysis.budgetWarnings.length > 0 ? `. Also, ${analysis.budgetWarnings.map((b) => `your "${b.category}" budget is at ${b.percentage}%`).join(", ")}.` : "."
      } That's the best place to start looking for savings.`,
    };
  }

  // --- Universal search fallback ---
  if (/^(search|find)\b/.test(lower)) {
    const query = t.replace(/^(search|find)\s*(for)?/i, "").trim();
    if (query) {
      const results = universalSearch(query);
      const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
      if (total === 0) return { text: `No results for "${query}" anywhere in AlienOS.` };
      const parts = (Object.entries(results) as [string, { label: string }[]][])
        .filter(([, items]) => items.length > 0)
        .map(([module, items]) => `**${module}** (${items.length}): ${items.slice(0, 3).map((i) => i.label).join(", ")}`);
      return { text: `Found ${total} result(s) for "${query}":\n\n${parts.join("\n")}` };
    }
  }

  return {
    text:
      "I'm running in **Demo mode**, so I only understand a focused set of requests right now - things like *\"what should I work on first\"*, *\"what does tomorrow look like\"*, *\"summarize my notes about X\"*, or *\"how much did I spend this month\"*.\n\nConnect a real provider in `Settings → AI` for open-ended conversation.",
  };
}
