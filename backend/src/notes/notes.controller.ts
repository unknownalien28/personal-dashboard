import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { AttachmentsService } from "../storage/attachments.service";
import { UploadFileDto, uploadFileSchema } from "../storage/dto/storage.schemas";
import { NotesService } from "./notes.service";
import {
  CreateNoteDto,
  NoteQuery,
  UpdateNoteDto,
  createNoteSchema,
  noteQuerySchema,
  updateNoteSchema,
} from "./dto/note.schemas";

@ApiTags("notes")
@ApiBearerAuth("access-token")
@Controller("notes")
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(noteQuerySchema)) query: NoteQuery) {
    return this.notesService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notesService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createNoteSchema)) dto: CreateNoteDto) {
    return this.notesService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) dto: UpdateNoteDto,
  ) {
    return this.notesService.update(user.id, id, dto);
  }

  @Patch(":id/trash")
  trash(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notesService.trash(user.id, id);
  }

  @Patch(":id/restore")
  restore(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notesService.restore(user.id, id);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notesService.remove(user.id, id);
  }

  @Get(":id/attachments")
  listAttachments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.attachmentsService.listForNote(user.id, id);
  }

  @Post(":id/attachments")
  async addAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(uploadFileSchema)) dto: UploadFileDto,
  ) {
    const buffer = Buffer.from(dto.dataBase64, "base64");
    return this.attachmentsService.addToNote(user.id, id, { filename: dto.filename, mimeType: dto.mimeType, buffer });
  }

  @Delete(":id/attachments/:attachmentId")
  async removeAttachment(@CurrentUser() user: AuthenticatedUser, @Param("attachmentId") attachmentId: string) {
    await this.attachmentsService.remove(user.id, attachmentId);
  }
}
