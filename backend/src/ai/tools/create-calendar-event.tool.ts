import { Injectable } from "@nestjs/common";
import { CalendarService } from "../../calendar/calendar.service";
import { createEventSchema } from "../../calendar/dto/calendar.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateCalendarEventTool implements AiTool {
  readonly name = "create_calendar_event";
  readonly description = "Create a new calendar event/appointment for the user.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      startDate: { type: "string", description: "ISO-8601 start date/time. Required." },
      endDate: { type: "string", description: "ISO-8601 end date/time. Required." },
      startTime: { type: "string", description: "Optional display time, e.g. '09:00'." },
      endTime: { type: "string", description: "Optional display time, e.g. '10:00'." },
      allDay: { type: "boolean" },
      category: { type: "string" },
      location: { type: "string" },
      reminder: { type: "string", enum: ["none", "atTime", "min5", "min15", "min30", "hour1", "day1"] },
      repeat: { type: "string", enum: ["none", "daily", "weekly", "monthly", "yearly"] },
    },
    required: ["title", "startDate", "endDate"],
  };

  constructor(private readonly calendarService: CalendarService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const parsed = createEventSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, message: `Invalid event input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    const event = await this.calendarService.createEvent(userId, parsed.data);
    return { success: true, message: `Created event "${event.title}" (id: ${event.id}).`, data: event };
  }
}
