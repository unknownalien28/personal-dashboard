import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto, UpdateBudgetDto, createBudgetSchema, updateBudgetSchema } from "./dto/finance.schemas";

@ApiTags("finance")
@ApiBearerAuth("access-token")
@Controller("finance/budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const budgets = await this.budgetsService.findAll(user.id);
    return Promise.all(
      budgets.map(async (budget) => ({
        ...budget,
        spent: await this.budgetsService.spentForCategory(user.id, budget.category, periodStart(budget.period)),
      })),
    );
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.budgetsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createBudgetSchema)) dto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBudgetSchema)) dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.budgetsService.remove(user.id, id);
  }
}

function periodStart(period: "weekly" | "monthly" | "yearly"): Date {
  const now = new Date();
  if (period === "weekly") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "yearly") return new Date(now.getFullYear(), 0, 1);
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
