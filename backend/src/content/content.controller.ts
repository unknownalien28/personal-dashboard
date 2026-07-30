import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { ContentService } from "./content.service";
import {
  ContentQuery,
  CreateContentPostDto,
  UpdateContentPostDto,
  contentQuerySchema,
  createContentPostSchema,
  updateContentPostSchema,
} from "./dto/content.schemas";

@ApiTags("content")
@ApiBearerAuth("access-token")
@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query(new ZodValidationPipe(contentQuerySchema)) query: ContentQuery) {
    return this.contentService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contentService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createContentPostSchema)) dto: CreateContentPostDto,
  ) {
    return this.contentService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateContentPostSchema)) dto: UpdateContentPostDto,
  ) {
    return this.contentService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contentService.remove(user.id, id);
  }
}
