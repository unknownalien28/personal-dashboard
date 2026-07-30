import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { TasksService } from "./tasks.service";
import {
  CreateTaskDto,
  TaskQuery,
  UpdateTaskDto,
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
} from "./dto/task.schemas";

@ApiTags("tasks")
@ApiBearerAuth("access-token")
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(taskQuerySchema)) query: TaskQuery) {
    return this.tasksService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tasksService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
