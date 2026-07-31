import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { assertOwned } from "../common/utils/ownership";
import {
  CreateEventDto,
  CreateHabitDto,
  EventQuery,
  ToggleHabitDateDto,
  UpdateEventDto,
} from "./dto/calendar.schemas";

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- Events
  async findAllEvents(userId: string, query: EventQuery) {
    const where: Prisma.CalendarEventWhereInput = {
      userId,
      ...(query.archived !== undefined && { archived: query.archived }),
      ...(query.from && { endDate: { gte: new Date(query.from) } }),
      ...(query.to && { startDate: { lte: new Date(query.to) } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({ where, orderBy: { startDate: "asc" }, ...toSkipTake(query) }),
      this.prisma.calendarEvent.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOneEvent(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id } });
    assertOwned(event, userId, "Event not found");
    return event;
  }

  createEvent(userId: string, dto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: { userId, ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
    });
  }

  async updateEvent(userId: string, id: string, dto: UpdateEventDto) {
    await this.findOneEvent(userId, id);
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async removeEvent(userId: string, id: string) {
    await this.findOneEvent(userId, id);
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ---------------------------------------------------------------- Habits
  findAllHabits(userId: string) {
    return this.prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async findOneHabit(userId: string, id: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    assertOwned(habit, userId, "Habit not found");
    return habit;
  }

  createHabit(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({ data: { userId, name: dto.name } });
  }

  /** Toggles a completion date and recomputes current/best streak from the completed-date set. */
  async toggleHabitDate(userId: string, id: string, dto: ToggleHabitDateDto) {
    const habit = await this.findOneHabit(userId, id);
    const day = startOfDay(new Date(dto.date));
    const existing = habit.completedDates.map((d) => startOfDay(d).getTime());
    const targetTime = day.getTime();

    const nextDates = existing.includes(targetTime)
      ? habit.completedDates.filter((d) => startOfDay(d).getTime() !== targetTime)
      : [...habit.completedDates, day];

    const { streak, bestStreak } = computeStreaks(nextDates, habit.bestStreak);

    return this.prisma.habit.update({
      where: { id },
      data: { completedDates: nextDates, streak, bestStreak },
    });
  }

  async removeHabit(userId: string, id: string) {
    await this.findOneHabit(userId, id);
    await this.prisma.habit.delete({ where: { id } });
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeStreaks(dates: Date[], previousBest: number): { streak: number; bestStreak: number } {
  const sorted = [...dates].map((d) => startOfDay(d).getTime()).sort((a, b) => a - b);
  if (sorted.length === 0) return { streak: 0, bestStreak: previousBest };

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const dayDiff = (sorted[i] - sorted[i - 1]) / 86_400_000;
    current = dayDiff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  const today = startOfDay(new Date()).getTime();
  const mostRecent = sorted[sorted.length - 1];
  const gapFromToday = (today - mostRecent) / 86_400_000;
  const activeStreak = gapFromToday <= 1 ? current : 0;

  return { streak: activeStreak, bestStreak: Math.max(longest, previousBest) };
}
