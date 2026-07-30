import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { NotificationsService } from "./notifications.service";
import {
  BulkMarkReadDto,
  CreateNotificationDto,
  NotificationQuery,
  bulkMarkReadSchema,
  createNotificationSchema,
  notificationQuerySchema,
} from "./dto/notification.schemas";

@ApiTags("notifications")
@ApiBearerAuth("access-token")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(notificationQuerySchema)) query: NotificationQuery,
  ) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.unreadCount(user.id).then((count) => ({ count }));
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createNotificationSchema)) dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(user.id, dto);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.markRead(user.id, id, true);
  }

  @Patch(":id/unread")
  markUnread(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.markRead(user.id, id, false);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch("read-bulk")
  bulkMarkRead(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(bulkMarkReadSchema)) dto: BulkMarkReadDto) {
    return this.notificationsService.bulkMarkRead(user.id, dto.ids);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
