import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TasksService } from "../../tasks/tasks.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class DeleteTaskTool implements AiTool {
  readonly name = "delete_task";
  readonly description = "Permanently delete a task by id. This cannot be undone — only call this when the user clearly wants a task removed.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      taskId: { type: "string", description: "The id of the task to delete." },
    },
    required: ["taskId"],
  };

  constructor(private readonly tasksService: TasksService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const taskId = args.taskId;
    if (typeof taskId !== "string" || !taskId) {
      return { success: false, message: "Invalid input: taskId is required." };
    }

    try {
      await this.tasksService.remove(userId, taskId);
      return { success: true, message: `Deleted task ${taskId}.` };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return { success: false, message: `No task found with id ${taskId}.` };
      }
      throw error;
    }
  }
}
