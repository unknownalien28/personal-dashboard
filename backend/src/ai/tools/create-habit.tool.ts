import { Injectable } from "@nestjs/common";
import { CalendarService } from "../../calendar/calendar.service";
import { createHabitSchema } from "../../calendar/dto/calendar.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateHabitTool implements AiTool {
  readonly name = "create_habit";
  readonly description = "Create a new habit for the user to track daily/streak-based.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "The habit's name, e.g. 'Drink water' or 'Read 20 minutes'." },
    },
    required: ["name"],
  };

  constructor(private readonly calendarService: CalendarService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const parsed = createHabitSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, message: `Invalid habit input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    const habit = await this.calendarService.createHabit(userId, parsed.data);
    return { success: true, message: `Created habit "${habit.name}" (id: ${habit.id}).`, data: habit };
  }
}
