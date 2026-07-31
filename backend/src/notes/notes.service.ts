import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { assertOwned } from "../common/utils/ownership";
import { CreateNoteDto, NoteQuery, UpdateNoteDto } from "./dto/note.schemas";

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: NoteQuery) {
    const where: Prisma.NoteWhereInput = {
      userId,
      ...(query.filter === "trash" && { deletedAt: { not: null } }),
      ...(query.filter !== "trash" && { deletedAt: null }),
      ...(query.filter === "pinned" && { pinned: true }),
      ...(query.filter === "archived" && { archived: true }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { content: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.note.findMany({ where, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], ...toSkipTake(query) }),
      this.prisma.note.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    assertOwned(note, userId, "Note not found");
    return note;
  }

  create(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  /** Soft-delete: moves the note to trash rather than removing it immediately. */
  async trash(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.note.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.note.update({ where: { id }, data: { deletedAt: null } });
  }

  /** Permanent delete — only valid for notes already in trash. */
  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.note.delete({ where: { id } });
  }
}
