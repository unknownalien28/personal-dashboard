import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { ContentQuery, CreateContentPostDto, UpdateContentPostDto } from "./dto/content.schemas";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ContentQuery) {
    const where: Prisma.ContentPostWhereInput = {
      userId,
      ...(query.platform && { platform: query.platform }),
      ...(query.status && { status: query.status }),
      ...(query.favorite !== undefined && { favorite: query.favorite }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { body: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.contentPost.findMany({ where, orderBy: { updatedAt: "desc" }, ...toSkipTake(query) }),
      this.prisma.contentPost.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const post = await this.prisma.contentPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Content post not found");
    if (post.userId !== userId) throw new ForbiddenException();
    return post;
  }

  create(userId: string, dto: CreateContentPostDto) {
    return this.prisma.contentPost.create({ data: { userId, ...dto, publishDate: dto.publishDate ?? null } });
  }

  async update(userId: string, id: string, dto: UpdateContentPostDto) {
    await this.findOne(userId, id);
    return this.prisma.contentPost.update({
      where: { id },
      data: { ...dto, publishDate: dto.publishDate === undefined ? undefined : dto.publishDate },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.contentPost.delete({ where: { id } });
  }
}
