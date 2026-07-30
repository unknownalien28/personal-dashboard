import type { ChatMessage } from "@/types/models";
import type { ModuleKey } from "./context-engine";

export interface FollowUpSuggestion {
  id: string;
  label: string;
  prompt: string;
  module?: ModuleKey;
  to?: string;
}

const TOOL_MODULE: Record<string, ModuleKey> = {
  createTask: "tasks",
  updateTask: "tasks",
  completeTask: "tasks",
  deleteTask: "tasks",
  createNote: "notes",
  updateNote: "notes",
  deleteNote: "notes",
  createEvent: "calendar",
  updateEvent: "calendar",
  deleteEvent: "calendar",
  createGoal: "goals",
  updateGoal: "goals",
  deleteGoal: "goals",
  createTransaction: "finance",
  deleteTransaction: "finance",
  createContentPost: "content",
  updateContentPost: "content",
  deleteContentPost: "content",
};

const MODULE_ROUTES: Record<ModuleKey, string> = {
  tasks: "/tasks",
  notes: "/notes",
  calendar: "/calendar",
  goals: "/goals",
  finance: "/finance",
  content: "/content",
};

/**
 * Phase 6, Part 4: after every assistant reply, a small set of contextual
 * quick actions - built from the same modules/tools the reply already
 * touched, so "Open Finance" only shows up when finance was actually
 * relevant, not on every single message.
 */
export function suggestFollowUps(message: ChatMessage): FollowUpSuggestion[] {
  if (message.role !== "assistant" || message.status !== "complete") return [];

  const suggestions: FollowUpSuggestion[] = [];
  const module = message.action ? TOOL_MODULE[message.action.tool] : undefined;
  const text = message.content.toLowerCase();

  if (module) {
    suggestions.push({ id: `open-${module}`, label: `Open ${module[0].toUpperCase()}${module.slice(1)}`, prompt: "", module, to: MODULE_ROUTES[module] });
  }

  if (text.includes("task")) {
    suggestions.push({ id: "create-task", label: "Create Task", prompt: "Create a task for this.", module: "tasks" });
  }
  if (text.includes("note")) {
    suggestions.push({ id: "summarize-more", label: "Summarize More", prompt: "Can you go into more detail?", module: "notes" });
  }
  if (text.includes("event") || text.includes("calendar") || text.includes("schedule") || text.includes("meeting")) {
    suggestions.push({ id: "open-calendar", label: "Open Calendar", prompt: "", to: "/calendar" });
  }
  if (text.includes("goal")) {
    suggestions.push({ id: "view-goal", label: "View Goal", prompt: "", to: "/goals" });
  }
  if (text.includes("spend") || text.includes("budget") || text.includes("$") || text.includes("save")) {
    suggestions.push({ id: "show-spending", label: "Show Spending", prompt: "", to: "/finance" });
  }
  if (text.includes("post") || text.includes("caption") || text.includes("content") || text.includes("hashtag")) {
    suggestions.push({ id: "generate-caption", label: "Generate Caption", prompt: "Generate a caption for this.", module: "content" });
  }

  suggestions.push({ id: "continue-research", label: "Continue Research", prompt: "Tell me more about this." });

  // De-dupe by id, cap at 4 so the row never wraps to a wall of chips.
  const seen = new Set<string>();
  return suggestions.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))).slice(0, 4);
}
