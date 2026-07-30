import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { GoalsService } from "../../goals/goals.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class DeleteGoalTool implements AiTool {
  readonly name = "delete_goal";
  readonly description =
    "Delete a goal by id. This moves it to trash (soft delete), matching how deleting a goal works elsewhere in AlienOS — it can still be restored from trash afterwards.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      goalId: { type: "string", description: "The id of the goal to delete." },
    },
    required: ["goalId"],
  };

  constructor(private readonly goalsService: GoalsService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const goalId = args.goalId;
    if (typeof goalId !== "string" || !goalId) {
      return { success: false, message: "Invalid input: goalId is required." };
    }

    try {
      const goal = await this.goalsService.trash(userId, goalId);
      return { success: true, message: `Moved goal "${goal.title}" (id: ${goal.id}) to trash.`, data: goal };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return { success: false, message: `No goal found with id ${goalId}.` };
      }
      throw error;
    }
  }
}
