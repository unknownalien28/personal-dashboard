import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../../notifications/notifications.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class ListNotificationsTool implements AiTool {
  readonly name = "list_notifications";
  readonly description = "List the user's notifications, optionally unread-only.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      unreadOnly: { type: "boolean", description: "Defaults to false (show all)." },
      limit: { type: "integer", description: "Max results, default 20, max 100." },
    },
    required: [],
  };

  constructor(private readonly notificationsService: NotificationsService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const limit = Math.min(typeof args.limit === "number" ? args.limit : 20, 100);
    const unreadOnly = args.unreadOnly === true;

    const result = await this.notificationsService.findAll(userId, { page: 1, limit, unreadOnly });
    return {
      success: true,
      message: `${result.items.length} notification(s)${unreadOnly ? " (unread only)" : ""}.`,
      data: result.items.map((n: { id: string; title: string; body: string; category: string; read: boolean; createdAt: Date }) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        category: n.category,
        read: n.read,
        createdAt: n.createdAt,
      })),
    };
  }
}
