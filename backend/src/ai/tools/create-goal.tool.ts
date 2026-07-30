import { Injectable } from "@nestjs/common";
import { GoalsService } from "../../goals/goals.service";
import { createGoalSchema } from "../../goals/dto/goal.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateGoalTool implements AiTool {
  readonly name = "create_goal";
  readonly description = "Create a new goal for the user to track progress toward.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      targetDate: { type: "string", description: "Optional ISO-8601 target date." },
      status: { type: "string", enum: ["notStarted", "inProgress", "completed", "onHold"] },
    },
    required: ["title"],
  };

  constructor(private readonly goalsService: GoalsService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const parsed = createGoalSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, message: `Invalid goal input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    const goal = await this.goalsService.create(userId, parsed.data);
    return { success: true, message: `Created goal "${goal.title}" (id: ${goal.id}).`, data: goal };
  }
}
