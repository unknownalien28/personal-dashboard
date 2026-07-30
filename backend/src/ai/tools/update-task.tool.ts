import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TasksService } from "../../tasks/tasks.service";
import { updateTaskSchema } from "../../tasks/dto/task.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class UpdateTaskTool implements AiTool {
  readonly name = "update_task";
  readonly description =
    "Update an existing task (title, category, priority, due date, or completed status). Requires the task's id — use search or dashboard stats first if you don't already have it.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      taskId: { type: "string", description: "The id of the task to update. Required." },
      title: { type: "string" },
      category: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      dueDate: { type: "string", description: "ISO-8601 date/time, or null to clear it." },
      completed: { type: "boolean" },
    },
    required: ["taskId"],
  };

  constructor(private readonly tasksService: TasksService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const { taskId, ...rest } = args as { taskId?: unknown };
    if (typeof taskId !== "string" || !taskId) {
      return { success: false, message: "Invalid input: taskId is required." };
    }

    const parsed = updateTaskSchema.safeParse(rest);
    if (!parsed.success) {
      return { success: false, message: `Invalid task update input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    try {
      const task = await this.tasksService.update(userId, taskId, parsed.data);
      return { success: true, message: `Updated task "${task.title}" (id: ${task.id}).`, data: task };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return { success: false, message: `No task found with id ${taskId}.` };
      }
      throw error;
    }
  }
}
