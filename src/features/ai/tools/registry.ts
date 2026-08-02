import * as taskTools from "./tasks-tools";
import * as noteTools from "./notes-tools";
import * as calendarTools from "./calendar-tools";
import * as goalTools from "./goals-tools";
import * as financeTools from "./finance-tools";
import * as conversationTools from "./conversations-tools";
import * as contentTools from "./content-tools";
import { fail, isDestructiveTool, type ToolResult } from "./types";

/**
 * Every write-capable tool the assistant is allowed to call by name, keyed
 * exactly as they appear in an `alienos-action` block (see action-protocol.ts).
 * Read-only tools (getTasks, searchNotes, analyzeFinance, ...) are called
 * directly by the context engine and aren't in this map - only actions the
 * assistant can *trigger* from a chat response need a name-based dispatch.
 */
export const actionRegistry: Record<string, (args: Record<string, unknown>) => ToolResult> = {
  createTask: (a) => taskTools.createTask(a as unknown as taskTools.CreateTaskArgs),
  updateTask: (a) => taskTools.updateTask(String(a.id ?? a.title), a as never),
  completeTask: (a) => taskTools.completeTask(String(a.id ?? a.title)),
  deleteTask: (a) => taskTools.deleteTask(String(a.id ?? a.title)),

  createNote: (a) => noteTools.createNote(a as unknown as noteTools.CreateNoteArgs),
  updateNote: (a) => noteTools.updateNote(String(a.id ?? a.title), a as never),
  deleteNote: (a) => noteTools.deleteNote(String(a.id ?? a.title)),

  createEvent: (a) => calendarTools.createEvent(a as never),
  updateEvent: (a) => calendarTools.updateEvent(String(a.id ?? a.title), a as never),
  deleteEvent: (a) => calendarTools.deleteEvent(String(a.id ?? a.title)),

  createGoal: (a) => goalTools.createGoal(a as never),
  updateGoal: (a) => goalTools.updateGoal(String(a.id ?? a.title), a as never),
  deleteGoal: (a) => goalTools.deleteGoal(String(a.id ?? a.title)),

  createTransaction: (a) => financeTools.createTransaction(a as never),
  deleteTransaction: (a) => financeTools.deleteTransaction(String(a.id)),

  deleteConversation: (a) => conversationTools.deleteConversationTool(String(a.id)),

  createContentPost: (a) => contentTools.createContentPost(a as never),
  updateContentPost: (a) => contentTools.updateContentPost(String(a.id ?? a.title), a as never),
  deleteContentPost: (a) => contentTools.deleteContentPost(String(a.id ?? a.title)),
};

export function runAction(name: string, args: Record<string, unknown>): ToolResult {
  const fn = actionRegistry[name];
  if (!fn) return fail(`Unknown action "${name}".`);
  try {
    return fn(args);
  } catch (err) {
    return fail(err instanceof Error ? err.message : `"${name}" failed.`);
  }
}

export { isDestructiveTool };
