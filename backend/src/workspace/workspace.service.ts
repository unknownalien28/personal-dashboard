import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { CreateWorkspaceDocumentDto, UpdateWorkspaceDocumentDto, WorkspaceQuery } from "./dto/workspace.schemas";

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: WorkspaceQuery) {
    const where: Prisma.WorkspaceDocumentWhereInput = {
      userId,
      ...(query.folder && { folder: query.folder }),
      ...(query.archived !== undefined && { archived: query.archived }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { content: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.workspaceDocument.findMany({ where, orderBy: { updatedAt: "desc" }, ...toSkipTake(query) }),
      this.prisma.workspaceDocument.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const doc = await this.prisma.workspaceDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.userId !== userId) throw new ForbiddenException();
    return doc;
  }

  create(userId: string, dto: CreateWorkspaceDocumentDto) {
    return this.prisma.workspaceDocument.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateWorkspaceDocumentDto) {
    await this.findOne(userId, id);
    return this.prisma.workspaceDocument.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.workspaceDocument.delete({ where: { id } });
  }
}
