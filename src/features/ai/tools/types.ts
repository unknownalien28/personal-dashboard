/**
 * Every AI tool - regardless of module - returns this shape. The assistant
 * (and the action protocol that executes write actions on its behalf) never
 * touches a Zustand store directly; it only ever calls a function from
 * `features/ai/tools/*` that returns a ToolResult.
 */
export interface ToolResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

export function ok<T>(message: string, data?: T): ToolResult<T> {
  return { ok: true, message, data };
}

export function fail(message: string): ToolResult<never> {
  return { ok: false, message };
}

/** Tools flagged destructive require user confirmation before the action protocol will run them. */
export const DESTRUCTIVE_TOOLS = new Set([
  "deleteTask",
  "deleteNote",
  "deleteEvent",
  "deleteGoal",
  "deleteConversation",
  "deleteTransaction",
  "deleteBudget",
  "deleteSavingsGoal",
  "deleteContentPost",
]);

export function isDestructiveTool(name: string): boolean {
  return DESTRUCTIVE_TOOLS.has(name);
}
