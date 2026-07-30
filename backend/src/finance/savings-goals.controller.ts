import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { SavingsGoalsService } from "./savings-goals.service";
import {
  AddContributionDto,
  CreateSavingsGoalDto,
  UpdateSavingsGoalDto,
  addContributionSchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
} from "./dto/finance.schemas";

@ApiTags("finance")
@ApiBearerAuth("access-token")
@Controller("finance/savings-goals")
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.savingsGoalsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savingsGoalsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSavingsGoalSchema)) dto: CreateSavingsGoalDto,
  ) {
    return this.savingsGoalsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSavingsGoalSchema)) dto: UpdateSavingsGoalDto,
  ) {
    return this.savingsGoalsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.savingsGoalsService.remove(user.id, id);
  }

  @Post(":id/contributions")
  addContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(addContributionSchema)) dto: AddContributionDto,
  ) {
    return this.savingsGoalsService.addContribution(user.id, id, dto);
  }

  @Delete(":id/contributions/:contributionId")
  removeContribution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("contributionId") contributionId: string,
  ) {
    return this.savingsGoalsService.removeContribution(user.id, id, contributionId);
  }
}
