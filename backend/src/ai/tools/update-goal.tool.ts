import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { GoalsService } from "../../goals/goals.service";
import { updateGoalSchema } from "../../goals/dto/goal.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class UpdateGoalTool implements AiTool {
  readonly name = "update_goal";
  readonly description = "Update an existing goal — title, description, status, priority, progress, or target date. Requires the goal's id.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      goalId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      targetDate: { type: "string" },
      status: { type: "string", enum: ["notStarted", "inProgress", "completed", "onHold"] },
      progress: { type: "integer", description: "0-100. Only set this if the user gives an explicit percentage; otherwise progress is computed from milestones." },
      archived: { type: "boolean" },
    },
    required: ["goalId"],
  };

  constructor(private readonly goalsService: GoalsService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const { goalId, ...rest } = args as { goalId?: unknown };
    if (typeof goalId !== "string" || !goalId) {
      return { success: false, message: "Invalid input: goalId is required." };
    }

    const parsed = updateGoalSchema.safeParse(rest);
    if (!parsed.success) {
      return { success: false, message: `Invalid goal update input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    try {
      const goal = await this.goalsService.update(userId, goalId, parsed.data);
      return { success: true, message: `Updated goal "${goal.title}" (id: ${goal.id}).`, data: goal };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return { success: false, message: `No goal found with id ${goalId}.` };
      }
      throw error;
    }
  }
}
