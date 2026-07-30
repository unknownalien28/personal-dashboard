import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { AttachmentsService } from "../storage/attachments.service";
import { UploadFileDto, uploadFileSchema } from "../storage/dto/storage.schemas";
import { WorkspaceService } from "./workspace.service";
import {
  CreateWorkspaceDocumentDto,
  UpdateWorkspaceDocumentDto,
  WorkspaceQuery,
  createWorkspaceDocumentSchema,
  updateWorkspaceDocumentSchema,
  workspaceQuerySchema,
} from "./dto/workspace.schemas";

@ApiTags("workspace")
@ApiBearerAuth("access-token")
@Controller("workspace")
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(workspaceQuerySchema)) query: WorkspaceQuery) {
    return this.workspaceService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.workspaceService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWorkspaceDocumentSchema)) dto: CreateWorkspaceDocumentDto,
  ) {
    return this.workspaceService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateWorkspaceDocumentSchema)) dto: UpdateWorkspaceDocumentDto,
  ) {
    return this.workspaceService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.workspaceService.remove(user.id, id);
  }

  @Get(":id/attachments")
  listAttachments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.attachmentsService.listForWorkspaceDocument(user.id, id);
  }

  @Post(":id/attachments")
  async addAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(uploadFileSchema)) dto: UploadFileDto,
  ) {
    const buffer = Buffer.from(dto.dataBase64, "base64");
    return this.attachmentsService.addToWorkspaceDocument(user.id, id, {
      filename: dto.filename,
      mimeType: dto.mimeType,
      buffer,
    });
  }

  @Delete(":id/attachments/:attachmentId")
  async removeAttachment(@CurrentUser() user: AuthenticatedUser, @Param("attachmentId") attachmentId: string) {
    await this.attachmentsService.remove(user.id, attachmentId);
  }
}
