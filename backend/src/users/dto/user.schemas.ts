import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().max(120).optional(),
  role: z.string().max(120).optional(),
  avatarColor: z.string().max(32).optional(),
  avatarDataUrl: z.string().nullable().optional(),
  email: z.string().email().optional(),
  bio: z.string().max(2000).optional(),
  timezone: z.string().max(64).optional(),
  language: z.string().max(16).optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const updateAppearanceSchema = z.object({
  accentColor: z.enum(["alienBlue", "cosmicPurple", "auroraGreen", "solarOrange", "crimsonRed", "sakuraPink"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  compactMode: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
});
export type UpdateAppearanceDto = z.infer<typeof updateAppearanceSchema>;

export const updateVisualEffectsSchema = z.object({
  ambientBackground: z.boolean().optional(),
  floatingPlanets: z.boolean().optional(),
  starField: z.boolean().optional(),
  floatingParticles: z.boolean().optional(),
  mouseParallax: z.boolean().optional(),
  glowEffects: z.boolean().optional(),
  glassEffects: z.boolean().optional(),
  reducedVisualEffects: z.boolean().optional(),
});
export type UpdateVisualEffectsDto = z.infer<typeof updateVisualEffectsSchema>;

export const updateNotificationSettingsSchema = z.object({
  calendarReminders: z.boolean().optional(),
  goalReminders: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
});
export type UpdateNotificationSettingsDto = z.infer<typeof updateNotificationSettingsSchema>;

export const updatePreferenceSettingsSchema = z.object({
  defaultCalendarView: z.enum(["month", "week", "day", "agenda"]).optional(),
  defaultNotesFilter: z.enum(["all", "pinned", "archived", "trash"]).optional(),
  defaultGoalView: z.enum(["grid", "list", "kanban"]).optional(),
  startupPage: z.enum(["home", "tasks", "notes", "calendar", "goals"]).optional(),
});
export type UpdatePreferenceSettingsDto = z.infer<typeof updatePreferenceSettingsSchema>;

export const updateAISettingsSchema = z.object({
  enabled: z.boolean().optional(),
  provider: z.enum(["auto", "demo", "openai", "anthropic", "gemini", "ollama"]).optional(),
  model: z.string().max(120).optional(),
  streaming: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
});
export type UpdateAISettingsDto = z.infer<typeof updateAISettingsSchema>;
