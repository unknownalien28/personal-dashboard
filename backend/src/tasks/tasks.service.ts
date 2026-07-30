import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { CreateTaskDto, TaskQuery, UpdateTaskDto } from "./dto/task.schemas";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: TaskQuery) {
    const where: Prisma.TaskWhereInput = {
      userId,
      ...(query.completed !== undefined && { completed: query.completed }),
      ...(query.category && { category: query.category }),
      ...(query.priority && { priority: query.priority }),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({ where, orderBy: { createdAt: "desc" }, ...toSkipTake(query) }),
      this.prisma.task.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");
    if (task.userId !== userId) throw new ForbiddenException();
    return task;
  }

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        category: dto.category,
        priority: dto.priority,
        dueDate: dto.dueDate ?? null,
        completed: dto.completed,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(userId, id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate === undefined ? undefined : dto.dueDate,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }
}
