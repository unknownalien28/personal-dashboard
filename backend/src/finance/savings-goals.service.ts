import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { assertOwned } from "../common/utils/ownership";
import { AddContributionDto, CreateSavingsGoalDto, UpdateSavingsGoalDto } from "./dto/finance.schemas";

@Injectable()
export class SavingsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      include: { contributions: { orderBy: { date: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findUnique({
      where: { id },
      include: { contributions: { orderBy: { date: "desc" } } },
    });
    assertOwned(goal, userId, "Savings goal not found");
    return goal;
  }

  create(userId: string, dto: CreateSavingsGoalDto) {
    return this.prisma.savingsGoal.create({
      data: { userId, ...dto, deadline: dto.deadline ?? null },
      include: { contributions: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateSavingsGoalDto) {
    await this.findOne(userId, id);
    return this.prisma.savingsGoal.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline === undefined ? undefined : dto.deadline },
      include: { contributions: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.savingsGoal.delete({ where: { id } });
  }

  /** Adds a contribution and atomically increments the goal's currentAmount. */
  async addContribution(userId: string, id: string, dto: AddContributionDto) {
    await this.findOne(userId, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.savingsContribution.create({
        data: { savingsGoalId: id, amount: dto.amount, date: dto.date ? new Date(dto.date) : new Date() },
      });
      return tx.savingsGoal.update({
        where: { id },
        data: { currentAmount: { increment: dto.amount } },
        include: { contributions: { orderBy: { date: "desc" } } },
      });
    });
  }

  async removeContribution(userId: string, id: string, contributionId: string) {
    const goal = await this.findOne(userId, id);
    const contribution = goal.contributions.find((c) => c.id === contributionId);
    if (!contribution) throw new NotFoundException("Contribution not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.savingsContribution.delete({ where: { id: contributionId } });
      return tx.savingsGoal.update({
        where: { id },
        data: { currentAmount: { decrement: contribution.amount } },
        include: { contributions: { orderBy: { date: "desc" } } },
      });
    });
  }
}
