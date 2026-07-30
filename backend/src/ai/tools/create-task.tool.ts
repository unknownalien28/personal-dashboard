import { Injectable } from "@nestjs/common";
import { TasksService } from "../../tasks/tasks.service";
import { createTaskSchema } from "../../tasks/dto/task.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateTaskTool implements AiTool {
  readonly name = "create_task";
  readonly description = "Create a new task for the user in AlienOS. Use this whenever the user asks to add/create a to-do or task.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "The task title. Required." },
      category: { type: "string", description: "Optional free-form category/label, e.g. 'Work' or 'Personal'." },
      priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority. Defaults to medium." },
      dueDate: { type: "string", description: "Optional ISO-8601 due date/time, e.g. 2026-08-01T09:00:00.000Z." },
    },
    required: ["title"],
  };

  constructor(private readonly tasksService: TasksService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const parsed = createTaskSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, message: `Invalid task input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    const task = await this.tasksService.create(userId, parsed.data);
    return { success: true, message: `Created task "${task.title}" (id: ${task.id}).`, data: task };
  }
}
