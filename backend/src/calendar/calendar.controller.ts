import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { CalendarService } from "./calendar.service";
import {
  CreateEventDto,
  CreateHabitDto,
  EventQuery,
  ToggleHabitDateDto,
  UpdateEventDto,
  createEventSchema,
  createHabitSchema,
  eventQuerySchema,
  toggleHabitDateSchema,
  updateEventSchema,
} from "./dto/calendar.schemas";

@ApiTags("calendar")
@ApiBearerAuth("access-token")
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // Events
  @Get("events")
  findAllEvents(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(eventQuerySchema)) query: EventQuery) {
    return this.calendarService.findAllEvents(user.id, query);
  }

  @Get("events/:id")
  findOneEvent(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.calendarService.findOneEvent(user.id, id);
  }

  @Post("events")
  createEvent(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto) {
    return this.calendarService.createEvent(user.id, dto);
  }

  @Patch("events/:id")
  updateEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.calendarService.updateEvent(user.id, id, dto);
  }

  @Delete("events/:id")
  removeEvent(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.calendarService.removeEvent(user.id, id);
  }

  // Habits
  @Get("habits")
  findAllHabits(@CurrentUser() user: AuthenticatedUser) {
    return this.calendarService.findAllHabits(user.id);
  }

  @Post("habits")
  createHabit(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createHabitSchema)) dto: CreateHabitDto) {
    return this.calendarService.createHabit(user.id, dto);
  }

  @Patch("habits/:id/toggle")
  toggleHabitDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(toggleHabitDateSchema)) dto: ToggleHabitDateDto,
  ) {
    return this.calendarService.toggleHabitDate(user.id, id, dto);
  }

  @Delete("habits/:id")
  removeHabit(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.calendarService.removeHabit(user.id, id);
  }
}
