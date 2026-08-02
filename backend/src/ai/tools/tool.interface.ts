import { JsonSchemaObject } from "../providers/gemini.types";

/**
 * A single action Alien can take inside AlienOS on the user's behalf.
 * Every tool:
 *  - declares its own JSON-Schema input shape (validated with zod before
 *    `execute` ever runs — see ToolRegistryService),
 *  - only ever acts within the scope of the authenticated userId it's
 *    given (never a raw request, never another user's data),
 *  - delegates all actual persistence to the existing domain services
 *    (TasksService, NotesService, ...) — tools never touch Prisma directly
 *    except for the read-only dashboard-stats aggregation, which has no
 *    dedicated service of its own,
 *  - returns a structured result instead of throwing for expected failure
 *    modes, so the model gets a useful error message back instead of the
 *    whole turn failing.
 */
export interface ToolExecutionResult {
  success: boolean;
  /** Human/model-readable summary of what happened — this is what gets fed back to the LLM as the tool result. */
  message: string;
  /** Structured payload for anything the model might want to reference (ids, computed values, lists). */
  data?: unknown;
}

export interface AiTool {
  readonly name: string;
  readonly description: string;
  readonly parameters: JsonSchemaObject;
  execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult>;
}
