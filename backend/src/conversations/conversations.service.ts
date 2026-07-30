import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { CreateConversationDto, CreateMessageDto, UpdateConversationDto, UpdateMessageDto } from "./dto/conversation.schemas";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      // List view doesn't need every message body — keep it light.
      select: { id: true, title: true, pinned: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
    });
  }

  async findOne(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) throw new ForbiddenException();
    return conversation;
  }

  create(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({ data: { userId, title: dto.title }, include: { messages: true } });
  }

  async update(userId: string, id: string, dto: UpdateConversationDto) {
    await this.assertOwnership(userId, id);
    return this.prisma.conversation.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
  }

  async addMessage(userId: string, conversationId: string, dto: CreateMessageDto) {
    await this.assertOwnership(userId, conversationId);
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: dto.role,
        content: dto.content,
        status: dto.status,
        errorMessage: dto.errorMessage,
        actionTool: dto.action?.tool,
        actionArgs: dto.action?.args as Prisma.InputJsonValue | undefined,
        actionStatus: dto.action?.status,
        actionResult: dto.action?.resultMessage,
      },
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  }

  async updateMessage(userId: string, conversationId: string, messageId: string, dto: UpdateMessageDto) {
    await this.assertOwnership(userId, conversationId);
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== conversationId) throw new NotFoundException("Message not found");

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        status: dto.status,
        errorMessage: dto.errorMessage,
        actionStatus: dto.actionStatus,
        actionResult: dto.actionResult,
      },
    });
  }

  async removeMessage(userId: string, conversationId: string, messageId: string) {
    await this.assertOwnership(userId, conversationId);
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message || message.conversationId !== conversationId) throw new NotFoundException("Message not found");
    await this.prisma.chatMessage.delete({ where: { id: messageId } });
  }

  private async assertOwnership(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.userId !== userId) throw new ForbiddenException();
  }
}
