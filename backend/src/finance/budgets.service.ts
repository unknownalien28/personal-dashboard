import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateBudgetDto, UpdateBudgetDto } from "./dto/finance.schemas";

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new NotFoundException("Budget not found");
    if (budget.userId !== userId) throw new ForbiddenException();
    return budget;
  }

  create(userId: string, dto: CreateBudgetDto) {
    return this.prisma.budget.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(userId, id);
    return this.prisma.budget.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.budget.delete({ where: { id } });
  }

  /** Sum of expense transactions in the given category since `since`, for budget-vs-actual comparisons. */
  async spentForCategory(userId: string, category: string, since: Date) {
    const result = await this.prisma.transaction.aggregate({
      where: { userId, category, type: "expense", date: { gte: since } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
