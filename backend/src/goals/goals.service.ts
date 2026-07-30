import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import {
  CreateGoalDto,
  CreateMilestoneDto,
  GoalQuery,
  UpdateGoalDto,
  UpdateMilestoneDto,
} from "./dto/goal.schemas";

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: GoalQuery) {
    const where: Prisma.GoalWhereInput = {
      userId,
      deletedAt: query.trashed ? { not: null } : null,
      ...(query.status && { status: query.status }),
      ...(query.archived !== undefined && { archived: query.archived }),
    };

    const [items, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: { milestones: true },
        ...toSkipTake(query),
      }),
      this.prisma.goal.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id }, include: { milestones: true } });
    if (!goal) throw new NotFoundException("Goal not found");
    if (goal.userId !== userId) throw new ForbiddenException();
    return goal;
  }

  create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: { userId, ...dto, targetDate: dto.targetDate ?? null },
      include: { milestones: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);
    return this.prisma.goal.update({
      where: { id },
      data: { ...dto, targetDate: dto.targetDate === undefined ? undefined : dto.targetDate },
      include: { milestones: true },
    });
  }

  async trash(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.goal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.goal.update({ where: { id }, data: { deletedAt: null } });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.goal.delete({ where: { id } });
  }

  // ------------------------------------------------------------ Milestones
  async addMilestone(userId: string, goalId: string, dto: CreateMilestoneDto) {
    const goal = await this.findOne(userId, goalId);
    await this.prisma.milestone.create({ data: { goalId: goal.id, title: dto.title } });
    return this.recomputeProgressIfAutomatic(goal.id);
  }

  async updateMilestone(userId: string, goalId: string, milestoneId: string, dto: UpdateMilestoneDto) {
    const goal = await this.findOne(userId, goalId);
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException("Milestone not found");

    await this.prisma.milestone.update({ where: { id: milestoneId }, data: dto });
    return this.recomputeProgressIfAutomatic(goal.id);
  }

  async removeMilestone(userId: string, goalId: string, milestoneId: string) {
    const goal = await this.findOne(userId, goalId);
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new NotFoundException("Milestone not found");

    await this.prisma.milestone.delete({ where: { id: milestoneId } });
    return this.recomputeProgressIfAutomatic(goal.id);
  }

  /** Recomputes `progress` from milestone completion ratio, unless the user has manually overridden it. */
  private async recomputeProgressIfAutomatic(goalId: string) {
    const goal = await this.prisma.goal.findUniqueOrThrow({ where: { id: goalId }, include: { milestones: true } });
    if (goal.manualProgress || goal.milestones.length === 0) return goal;

    const completed = goal.milestones.filter((m) => m.completed).length;
    const progress = Math.round((completed / goal.milestones.length) * 100);

    return this.prisma.goal.update({ where: { id: goalId }, data: { progress }, include: { milestones: true } });
  }
}
