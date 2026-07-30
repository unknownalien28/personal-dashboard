import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { StorageService } from "../storage/storage.service";
import {
  UpdateAISettingsDto,
  UpdateAppearanceDto,
  UpdateNotificationSettingsDto,
  UpdatePreferenceSettingsDto,
  UpdateProfileDto,
  UpdateVisualEffectsDto,
} from "./dto/user.schemas";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        appearanceSettings: true,
        visualEffectsSettings: true,
        notificationSettings: true,
        preferenceSettings: true,
        aiSettings: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const {
      passwordHash: _passwordHash,
      emailVerificationTokenHash: _evth,
      passwordResetTokenHash: _prth,
      ...safe
    } = user;
    return safe;
  }

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  updateAppearance(userId: string, dto: UpdateAppearanceDto) {
    return this.prisma.appearanceSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  updateVisualEffects(userId: string, dto: UpdateVisualEffectsDto) {
    return this.prisma.visualEffectsSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  updateNotificationSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  updatePreferenceSettings(userId: string, dto: UpdatePreferenceSettingsDto) {
    return this.prisma.preferenceSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  updateAISettings(userId: string, dto: UpdateAISettingsDto) {
    return this.prisma.aISettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  /**
   * Used by the AI orchestrator to resolve the user's preferred provider
   * without pulling the full `me()` payload. Falls back to schema defaults
   * (enabled=true, provider=gemini) if the row somehow doesn't exist yet —
   * it normally does, created at signup (see AuthService.register).
   */
  async getAISettings(userId: string) {
    const settings = await this.prisma.aISettings.findUnique({ where: { userId } });
    return (
      settings ?? {
        id: "",
        userId,
        enabled: true,
        provider: "auto" as const,
        model: "",
        streaming: true,
        temperature: 0.7,
        maxTokens: 1024,
      }
    );
  }

  /** Uploads an avatar image and points the profile's avatarDataUrl at its storage URL. */
  async setAvatar(userId: string, filename: string, mimeType: string, buffer: Buffer) {
    const key = this.storageService.buildKey(`users/${userId}/avatar`, filename, buffer);
    const meta = await this.storageService.save(key, buffer, mimeType);
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarDataUrl: meta.url },
      update: { avatarDataUrl: meta.url },
    });
  }
}
