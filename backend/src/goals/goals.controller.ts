import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { GoalsService } from "./goals.service";
import {
  CreateGoalDto,
  CreateMilestoneDto,
  GoalQuery,
  UpdateGoalDto,
  UpdateMilestoneDto,
  createGoalSchema,
  createMilestoneSchema,
  goalQuerySchema,
  updateGoalSchema,
  updateMilestoneSchema,
} from "./dto/goal.schemas";

@ApiTags("goals")
@ApiBearerAuth("access-token")
@Controller("goals")
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(goalQuerySchema)) query: GoalQuery) {
    return this.goalsService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.goalsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createGoalSchema)) dto: CreateGoalDto) {
    return this.goalsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGoalSchema)) dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.id, id, dto);
  }

  @Patch(":id/trash")
  trash(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.goalsService.trash(user.id, id);
  }

  @Patch(":id/restore")
  restore(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.goalsService.restore(user.id, id);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.goalsService.remove(user.id, id);
  }

  @Post(":id/milestones")
  addMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createMilestoneSchema)) dto: CreateMilestoneDto,
  ) {
    return this.goalsService.addMilestone(user.id, id, dto);
  }

  @Patch(":id/milestones/:milestoneId")
  updateMilestone(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("milestoneId") milestoneId: string,
    @Body(new ZodValidationPipe(updateMilestoneSchema)) dto: UpdateMilestoneDto,
  ) {
    return this.goalsService.updateMilestone(user.id, id, milestoneId, dto);
  }

  @Delete(":id/milestones/:milestoneId")
  removeMilestone(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Param("milestoneId") milestoneId: string) {
    return this.goalsService.removeMilestone(user.id, id, milestoneId);
  }
}
