import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

/**
 * There is no dedicated "dashboard" module/service in AlienOS yet — the
 * frontend dashboard is assembled client-side from the individual feature
 * endpoints. Rather than invent a new module+controller (out of scope for
 * a tool that only ever reads, and to avoid duplicating each feature's own
 * query logic), this tool does its own light, read-only aggregation
 * directly against Prisma, scoped to the requesting user.
 */
@Injectable()
export class DashboardStatsTool implements AiTool {
  readonly name = "read_dashboard_statistics";
  readonly description =
    "Get a snapshot of the user's AlienOS activity: task counts, overdue tasks, notes, goal progress, habit streaks, upcoming events, unread notifications, and account balances. Use this to answer 'how am I doing' style questions or before deciding what to help with next.";
  readonly parameters = { type: "object" as const, properties: {}, required: [] };

  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<ToolExecutionResult> {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      totalNotes,
      goalsInProgress,
      goalsCompleted,
      habits,
      upcomingEvents,
      unreadNotifications,
      accounts,
    ] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.task.count({ where: { userId, completed: true } }),
      this.prisma.task.count({ where: { userId, completed: false, dueDate: { lt: now } } }),
      this.prisma.note.count({ where: { userId, deletedAt: null } }),
      this.prisma.goal.count({ where: { userId, deletedAt: null, status: "inProgress" } }),
      this.prisma.goal.count({ where: { userId, deletedAt: null, status: "completed" } }),
      this.prisma.habit.findMany({ where: { userId }, select: { name: true, streak: true, bestStreak: true } }),
      this.prisma.calendarEvent.count({ where: { userId, archived: false, startDate: { gte: now, lte: in7Days } } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
      this.prisma.account.findMany({ where: { userId, archived: false }, select: { name: true, currency: true, balance: true } }),
    ]);

    const data = {
      tasks: { total: totalTasks, completed: completedTasks, overdue: overdueTasks },
      notes: { total: totalNotes },
      goals: { inProgress: goalsInProgress, completed: goalsCompleted },
      habits: habits.map((h: { name: string; streak: number; bestStreak: number }) => ({
        name: h.name,
        streak: h.streak,
        bestStreak: h.bestStreak,
      })),
      upcomingEventsNext7Days: upcomingEvents,
      unreadNotifications,
      accounts: accounts.map((a: { name: string; currency: string; balance: unknown }) => ({
        name: a.name,
        currency: a.currency,
        balance: Number(a.balance),
      })),
    };

    return {
      success: true,
      message: `Snapshot: ${data.tasks.total} tasks (${data.tasks.completed} done, ${data.tasks.overdue} overdue), ${data.notes.total} notes, ${data.goals.inProgress} goals in progress, ${data.upcomingEventsNext7Days} events in the next 7 days, ${data.unreadNotifications} unread notifications.`,
      data,
    };
  }
}
