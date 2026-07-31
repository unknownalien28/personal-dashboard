import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { assertOwned } from "../common/utils/ownership";
import { StorageService } from "./storage.service";

export interface AddAttachmentInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async addToNote(userId: string, noteId: string, input: AddAttachmentInput) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    assertOwned(note, userId, "Note not found");

    const key = this.storageService.buildKey(`users/${userId}/notes/${noteId}`, input.filename, input.buffer);
    const meta = await this.storageService.save(key, input.buffer, input.mimeType);

    return this.prisma.attachment.create({
      data: {
        userId,
        parentType: "note",
        noteId,
        filename: input.filename,
        mimeType: input.mimeType,
        size: meta.size,
        storageKey: meta.key,
        url: meta.url,
      },
    });
  }

  async addToWorkspaceDocument(userId: string, documentId: string, input: AddAttachmentInput) {
    const doc = await this.prisma.workspaceDocument.findUnique({ where: { id: documentId } });
    assertOwned(doc, userId, "Workspace document not found");

    const key = this.storageService.buildKey(`users/${userId}/workspace/${documentId}`, input.filename, input.buffer);
    const meta = await this.storageService.save(key, input.buffer, input.mimeType);

    return this.prisma.attachment.create({
      data: {
        userId,
        parentType: "workspaceDocument",
        workspaceDocumentId: documentId,
        filename: input.filename,
        mimeType: input.mimeType,
        size: meta.size,
        storageKey: meta.key,
        url: meta.url,
      },
    });
  }

  listForNote(userId: string, noteId: string) {
    return this.prisma.attachment.findMany({ where: { userId, noteId }, orderBy: { createdAt: "desc" } });
  }

  listForWorkspaceDocument(userId: string, documentId: string) {
    return this.prisma.attachment.findMany({ where: { userId, workspaceDocumentId: documentId }, orderBy: { createdAt: "desc" } });
  }

  async remove(userId: string, attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id: attachmentId } });
    assertOwned(attachment, userId, "Attachment not found");

    await this.storageService.delete(attachment.storageKey);
    await this.prisma.attachment.delete({ where: { id: attachmentId } });
  }
}
