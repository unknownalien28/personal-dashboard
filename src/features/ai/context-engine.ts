export type ModuleKey = "tasks" | "notes" | "calendar" | "goals" | "finance" | "content";

const MODULE_KEYWORDS: Record<ModuleKey, string[]> = {
  tasks: ["task", "todo", "to-do", "to do", "overdue", "work on", "checklist"],
  notes: ["note", "notes", "wrote", "write up", "summarize", "summary", "meeting notes"],
  calendar: ["calendar", "event", "schedule", "meeting", "tomorrow", "today", "free time", "appointment", "agenda"],
  goals: ["goal", "goals", "milestone", "habit", "progress", "behind on"],
  finance: ["spend", "spent", "spending", "budget", "money", "expense", "income", "savings", "save money", "transaction", "balance"],
  content: ["content", "post", "caption", "hashtag", "campaign", "publish", "social media", "draft", "platform"],
};

const MODULE_LABELS: Record<ModuleKey, string> = {
  tasks: "Tasks",
  notes: "Notes",
  calendar: "Calendar",
  goals: "Goals",
  finance: "Finance",
  content: "Content Planner",
};

/** Cheap keyword-based intent detection - deliberately simple and fast, no model round-trip required to decide what's relevant. */
export function detectRelevantModules(message: string): ModuleKey[] {
  const text = message.toLowerCase();
  const found = (Object.keys(MODULE_KEYWORDS) as ModuleKey[]).filter((key) =>
    MODULE_KEYWORDS[key].some((kw) => text.includes(kw)),
  );

  const wantsBroadSummary = /\b(weekly|week in review|overview|summary of everything|how am i doing|catch me up)\b/.test(text);
  if (wantsBroadSummary) return ["tasks", "calendar", "goals", "finance", "content"];

  return found;
}

/**
 * Builds short, human-readable hint strings for the backend's
 * `moduleHints` field — e.g. "The user is currently viewing the Finance
 * page." Actual workspace data (tasks, notes, balances, etc.) is no
 * longer assembled client-side: the backend's AI orchestration layer
 * fetches it itself via tool calls (read_dashboard_statistics,
 * search_workspace, search_notes, ...) against the authoritative
 * database, which keeps the assistant's answers accurate and avoids
 * shipping a second, potentially stale copy of the data over the wire.
 */
export function buildModuleHints(message: string, forceModules: ModuleKey[] = []): { modules: ModuleKey[]; hints: string[] } {
  const detected = detectRelevantModules(message);
  const modules = Array.from(new Set([...forceModules, ...detected]));
  if (modules.length === 0) return { modules, hints: [] };

  const hints = modules.map((key, index) =>
    index === 0 && forceModules.includes(key)
      ? `The user is currently viewing the ${MODULE_LABELS[key]} page.`
      : `This message seems related to ${MODULE_LABELS[key]}.`,
  );
  return { modules, hints };
}
