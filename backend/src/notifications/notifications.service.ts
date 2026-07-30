import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { CreateNotificationDto, NotificationQuery } from "./dto/notification.schemas";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: NotificationQuery) {
    const where: Prisma.NotificationWhereInput = { userId, ...(query.unreadOnly && { read: false }) };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, ...toSkipTake(query) }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  /** Used internally by other modules (e.g. calendar/goal reminders) to push a notification for a user. */
  create(userId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: { userId, ...dto } });
  }

  async markRead(userId: string, id: string, read = true) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException("Notification not found");
    if (notification.userId !== userId) throw new ForbiddenException();
    return this.prisma.notification.update({ where: { id }, data: { read } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  /** Marks a specific set of notification ids as read, scoped to the requesting user. */
  bulkMarkRead(userId: string, ids: string[]) {
    return this.prisma.notification.updateMany({ where: { userId, id: { in: ids } }, data: { read: true } });
  }

  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException("Notification not found");
    if (notification.userId !== userId) throw new ForbiddenException();
    await this.prisma.notification.delete({ where: { id } });
  }
}
