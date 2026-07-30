import { useTasksStore } from "@/features/tasks/tasks-store";
import { useNotesStore } from "@/features/notes/notes-store";
import { useGoalsStore } from "@/features/goals/goals-store";
import { useCalendarStore } from "@/features/calendar/calendar-store";
import { useFinanceStore } from "@/features/finance/finance-store";
import { useConversationsStore } from "@/features/ai/conversations-store";
import { useContentStore } from "@/features/content/content-store";

export interface SearchHit {
  id: string;
  label: string;
  sublabel?: string;
  to: string;
}

export interface UniversalSearchResults {
  tasks: SearchHit[];
  notes: SearchHit[];
  goals: SearchHit[];
  calendar: SearchHit[];
  finance: SearchHit[];
  conversations: SearchHit[];
  content: SearchHit[];
}

function includes(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

/**
 * A single search across every module's data at once. Deliberately a plain
 * substring match over titles/content rather than a network round-trip -
 * instant, works offline, and needs no AI provider or API key at all.
 */
export function universalSearch(query: string, limit = 8): UniversalSearchResults {
  const q = query.trim();
  if (!q) return { tasks: [], notes: [], goals: [], calendar: [], finance: [], conversations: [], content: [] };

  const tasks = useTasksStore
    .getState()
    .tasks.filter((t) => includes(t.title, q) || includes(t.category, q))
    .slice(0, limit)
    .map((t): SearchHit => ({ id: t.id, label: t.title, sublabel: t.category, to: "/tasks" }));

  const notes = useNotesStore
    .getState()
    .notes.filter((n) => !n.deletedAt && (includes(n.title, q) || includes(n.content, q)))
    .slice(0, limit)
    .map((n): SearchHit => ({ id: n.id, label: n.title || "Untitled note", sublabel: "Note", to: "/notes" }));

  const goals = useGoalsStore
    .getState()
    .goals.filter((g) => !g.deletedAt && includes(g.title, q))
    .slice(0, limit)
    .map((g): SearchHit => ({ id: g.id, label: g.title, sublabel: `${g.progress}% complete`, to: "/goals" }));

  const calendar = useCalendarStore
    .getState()
    .events.filter((e) => !e.archived && (includes(e.title, q) || includes(e.location, q)))
    .slice(0, limit)
    .map((e): SearchHit => ({ id: e.id, label: e.title, sublabel: e.startDate, to: "/calendar" }));

  const finance = useFinanceStore
    .getState()
    .transactions.filter((t) => !t.archived && (includes(t.category, q) || includes(t.notes, q)))
    .slice(0, limit)
    .map((t): SearchHit => ({ id: t.id, label: `${t.category} - $${t.amount.toFixed(2)}`, sublabel: t.date, to: "/finance" }));

  const conversations = useConversationsStore
    .getState()
    .conversations.filter((c) => includes(c.title, q) || c.messages.some((m) => includes(m.content, q)))
    .slice(0, limit)
    .map((c): SearchHit => ({ id: c.id, label: c.title, sublabel: "Chat", to: "/ai" }));

  const content = useContentStore
    .getState()
    .posts.filter((p) => includes(p.title, q) || includes(p.body, q) || p.tags.some((t) => includes(t, q)))
    .slice(0, limit)
    .map((p): SearchHit => ({ id: p.id, label: p.title || "Untitled", sublabel: p.status, to: "/content" }));

  return { tasks, notes, goals, calendar, finance, conversations, content };
}
