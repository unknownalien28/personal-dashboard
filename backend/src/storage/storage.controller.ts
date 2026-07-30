import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { StorageService } from "./storage.service";
import { UploadFileDto, uploadFileSchema } from "./dto/storage.schemas";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB — generous enough for images/attachments, not exports.

@ApiTags("storage")
@ApiBearerAuth("access-token")
@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload")
  async upload(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(uploadFileSchema)) dto: UploadFileDto) {
    const buffer = Buffer.from(dto.dataBase64, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit`);
    }

    const key = this.storageService.buildKey(`users/${user.id}/uploads`, dto.filename, buffer);
    return this.storageService.save(key, buffer, dto.mimeType);
  }

  @Get("files/:key(*)")
  async download(@CurrentUser() user: AuthenticatedUser, @Param("key") key: string, @Res() res: Response) {
    if (!key.startsWith(`users/${user.id}/`)) {
      throw new ForbiddenException("You do not have access to this file");
    }
    const buffer = await this.storageService.read(key);
    res.send(buffer);
  }
}
