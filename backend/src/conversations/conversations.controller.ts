import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { ConversationsService } from "./conversations.service";
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationDto,
  UpdateMessageDto,
  createConversationSchema,
  createMessageSchema,
  updateConversationSchema,
  updateMessageSchema,
} from "./dto/conversation.schemas";

@ApiTags("conversations")
@ApiBearerAuth("access-token")
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.conversationsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.conversationsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createConversationSchema)) dto: CreateConversationDto,
  ) {
    return this.conversationsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateConversationSchema)) dto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.conversationsService.remove(user.id, id);
  }

  @Post(":id/messages")
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createMessageSchema)) dto: CreateMessageDto,
  ) {
    return this.conversationsService.addMessage(user.id, id, dto);
  }

  @Patch(":id/messages/:messageId")
  updateMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("messageId") messageId: string,
    @Body(new ZodValidationPipe(updateMessageSchema)) dto: UpdateMessageDto,
  ) {
    return this.conversationsService.updateMessage(user.id, id, messageId, dto);
  }

  @Delete(":id/messages/:messageId")
  removeMessage(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Param("messageId") messageId: string) {
    return this.conversationsService.removeMessage(user.id, id, messageId);
  }
}
