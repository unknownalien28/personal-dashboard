import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { UsersService } from "./users.service";
import {
  UpdateAISettingsDto,
  UpdateAppearanceDto,
  UpdateNotificationSettingsDto,
  UpdatePreferenceSettingsDto,
  UpdateProfileDto,
  UpdateVisualEffectsDto,
  updateAISettingsSchema,
  updateAppearanceSchema,
  updateNotificationSettingsSchema,
  updatePreferenceSettingsSchema,
  updateProfileSchema,
  updateVisualEffectsSchema,
} from "./dto/user.schemas";
import { UploadAvatarDto, uploadAvatarSchema } from "./dto/avatar.schemas";

@ApiTags("users")
@ApiBearerAuth("access-token")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.me(user.id);
  }

  @Patch("me/profile")
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch("me/settings/appearance")
  updateAppearance(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateAppearanceSchema)) dto: UpdateAppearanceDto,
  ) {
    return this.usersService.updateAppearance(user.id, dto);
  }

  @Patch("me/settings/visual-effects")
  updateVisualEffects(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateVisualEffectsSchema)) dto: UpdateVisualEffectsDto,
  ) {
    return this.usersService.updateVisualEffects(user.id, dto);
  }

  @Patch("me/settings/notifications")
  updateNotificationSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateNotificationSettingsSchema)) dto: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(user.id, dto);
  }

  @Patch("me/settings/preferences")
  updatePreferenceSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updatePreferenceSettingsSchema)) dto: UpdatePreferenceSettingsDto,
  ) {
    return this.usersService.updatePreferenceSettings(user.id, dto);
  }

  @Patch("me/settings/ai")
  @ApiOperation({
    summary: "Update the current user's AI Settings",
    description:
      "Controls whether Alien is enabled at all, and default model/temperature/maxTokens/streaming behavior. The AI orchestration layer reads this on every request; Gemini is AlienOS's only AI provider (see backend .env.example).",
  })
  updateAISettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateAISettingsSchema)) dto: UpdateAISettingsDto,
  ) {
    return this.usersService.updateAISettings(user.id, dto);
  }

  @Post("me/avatar")
  uploadAvatar(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(uploadAvatarSchema)) dto: UploadAvatarDto) {
    const buffer = Buffer.from(dto.dataBase64, "base64");
    return this.usersService.setAvatar(user.id, dto.filename, dto.mimeType, buffer);
  }
}
