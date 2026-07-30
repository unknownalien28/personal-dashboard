import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CalendarService } from "../../calendar/calendar.service";
import { updateEventSchema } from "../../calendar/dto/calendar.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class UpdateCalendarEventTool implements AiTool {
  readonly name = "update_calendar_event";
  readonly description = "Update an existing calendar event. Requires the event's id.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      eventId: { type: "string" },
      title: { type: "string" },
      description: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      startTime: { type: "string" },
      endTime: { type: "string" },
      allDay: { type: "boolean" },
      category: { type: "string" },
      location: { type: "string" },
      reminder: { type: "string", enum: ["none", "atTime", "min5", "min15", "min30", "hour1", "day1"] },
      repeat: { type: "string", enum: ["none", "daily", "weekly", "monthly", "yearly"] },
      archived: { type: "boolean" },
    },
    required: ["eventId"],
  };

  constructor(private readonly calendarService: CalendarService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const { eventId, ...rest } = args as { eventId?: unknown };
    if (typeof eventId !== "string" || !eventId) {
      return { success: false, message: "Invalid input: eventId is required." };
    }

    const parsed = updateEventSchema.safeParse(rest);
    if (!parsed.success) {
      return { success: false, message: `Invalid event update input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    try {
      const event = await this.calendarService.updateEvent(userId, eventId, parsed.data);
      return { success: true, message: `Updated event "${event.title}" (id: ${event.id}).`, data: event };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return { success: false, message: `No calendar event found with id ${eventId}.` };
      }
      throw error;
    }
  }
}
