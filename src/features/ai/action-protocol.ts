import { runAction, isDestructiveTool } from "./tools/registry";
import type { ChatAction } from "@/types/models";

const ACTION_BLOCK = /```alienos-action\n([\s\S]*?)```/;

export interface ParsedAction {
  tool: string;
  args: Record<string, unknown>;
}

/** Looks for a single ```alienos-action fenced JSON block: {"tool": "...", "args": {...}}. */
export function parseActionBlock(text: string): ParsedAction | null {
  const match = text.match(ACTION_BLOCK);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (typeof parsed?.tool !== "string") return null;
    return { tool: parsed.tool, args: parsed.args ?? {} };
  } catch {
    return null;
  }
}

/** Removes the action block from the text shown to the user - it's rendered as a distinct action card instead. */
export function stripActionBlock(text: string): string {
  return text.replace(ACTION_BLOCK, "").trim();
}

/**
 * Non-destructive actions run immediately and come back "executed".
 * Destructive ones (delete*) are never run here - they come back "pending"
 * so the UI can ask the user to confirm first (see Safe Actions in the spec).
 */
export function stageAction(parsed: ParsedAction): ChatAction {
  if (isDestructiveTool(parsed.tool)) {
    return { tool: parsed.tool, args: parsed.args, status: "pending" };
  }
  const result = runAction(parsed.tool, parsed.args);
  return { tool: parsed.tool, args: parsed.args, status: result.ok ? "executed" : "failed", resultMessage: result.message };
}

/** Runs a previously-staged destructive action after the user confirms it. */
export function confirmAction(action: ChatAction): ChatAction {
  const result = runAction(action.tool, action.args);
  return { ...action, status: result.ok ? "confirmed" : "failed", resultMessage: result.message };
}

export function cancelAction(action: ChatAction): ChatAction {
  return { ...action, status: "cancelled", resultMessage: "Cancelled - nothing was changed." };
}
