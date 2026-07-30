import { Injectable, Logger } from "@nestjs/common";
import { AiToolDefinition } from "../providers/ai-provider.interface";
import { AiTool, ToolExecutionResult } from "./tool.interface";
import { CreateTaskTool } from "./create-task.tool";
import { UpdateTaskTool } from "./update-task.tool";
import { DeleteTaskTool } from "./delete-task.tool";
import { CreateNoteTool } from "./create-note.tool";
import { SearchNotesTool } from "./search-notes.tool";
import { CreateGoalTool } from "./create-goal.tool";
import { UpdateGoalTool } from "./update-goal.tool";
import { DeleteGoalTool } from "./delete-goal.tool";
import { CreateHabitTool } from "./create-habit.tool";
import { CreateCalendarEventTool } from "./create-calendar-event.tool";
import { UpdateCalendarEventTool } from "./update-calendar-event.tool";
import { CreateTransactionTool } from "./create-transaction.tool";
import { DashboardStatsTool } from "./dashboard-stats.tool";
import { SearchWorkspaceTool } from "./search-workspace.tool";
import { ListNotificationsTool } from "./list-notifications.tool";

/**
 * Central registry for every action Alien can take inside AlienOS.
 *
 * Security model:
 *  - Authentication is already enforced upstream — a tool call only ever
 *    reaches here from an authenticated request (JwtAuthGuard on the AI
 *    controller), and the resolved `userId` comes from that authenticated
 *    session, never from the model's tool-call arguments.
 *  - Authorization/ownership is enforced by the underlying domain services
 *    themselves (every findOne/update/remove already checks
 *    `resource.userId === userId` and throws otherwise) — tools don't
 *    duplicate that logic, they inherit it.
 *  - Input validation happens per-tool using the SAME zod schemas the
 *    HTTP controllers use, so a tool call is held to the same bar as a
 *    typed API request.
 *  - There is no generic/arbitrary-code-execution tool and there never
 *    will be — only this fixed, explicit, whitelisted set of tools is
 *    ever exposed to a model.
 *  - Any exception a tool doesn't itself convert into a structured
 *    `{success:false}` result is caught here and turned into one, so a
 *    single failing tool call can't crash the whole conversation turn.
 */
@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools: Map<string, AiTool>;

  constructor(
    createTask: CreateTaskTool,
    updateTask: UpdateTaskTool,
    deleteTask: DeleteTaskTool,
    createNote: CreateNoteTool,
    searchNotes: SearchNotesTool,
    createGoal: CreateGoalTool,
    updateGoal: UpdateGoalTool,
    deleteGoal: DeleteGoalTool,
    createHabit: CreateHabitTool,
    createCalendarEvent: CreateCalendarEventTool,
    updateCalendarEvent: UpdateCalendarEventTool,
    createTransaction: CreateTransactionTool,
    dashboardStats: DashboardStatsTool,
    searchWorkspace: SearchWorkspaceTool,
    listNotifications: ListNotificationsTool,
  ) {
    const all: AiTool[] = [
      createTask,
      updateTask,
      deleteTask,
      createNote,
      searchNotes,
      createGoal,
      updateGoal,
      deleteGoal,
      createHabit,
      createCalendarEvent,
      updateCalendarEvent,
      createTransaction,
      dashboardStats,
      searchWorkspace,
      listNotifications,
    ];
    this.tools = new Map(all.map((tool) => [tool.name, tool]));
  }

  /** Provider-agnostic tool definitions, ready to be translated per-vendor by each AiProvider. */
  getDefinitions(): AiToolDefinition[] {
    return [...this.tools.values()].map((tool) => ({ name: tool.name, description: tool.description, parameters: tool.parameters }));
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Executes a single tool call for the given authenticated user. Never
   * throws — unexpected errors are caught and returned as a structured
   * failure so the calling orchestrator can always feed *something* back
   * to the model and keep the conversation going.
   */
  async execute(name: string, userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, message: `Unknown tool "${name}". No action was taken.` };
    }

    try {
      return await tool.execute(userId, args ?? {});
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Tool "${name}" failed for user ${userId}: ${description}`);
      return { success: false, message: `The "${name}" action failed: ${description}` };
    }
  }
}
