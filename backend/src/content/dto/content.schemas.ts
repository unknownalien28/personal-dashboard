import { z } from "zod";
import { priorityEnum } from "../../tasks/dto/task.schemas";

export const contentPlatformEnum = z.enum([
  "x",
  "facebook",
  "instagram",
  "linkedin",
  "tiktok",
  "youtube",
  "threads",
  "telegram",
  "whatsapp",
  "blog",
  "custom",
]);

export const contentStatusEnum = z.enum([
  "idea",
  "researching",
  "writing",
  "editing",
  "scheduled",
  "published",
  "archived",
]);

export const createContentPostSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().default(""),
  body: z.string().default(""),
  platform: contentPlatformEnum.default("x"),
  customPlatformName: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  mentions: z.array(z.string()).default([]),
  status: contentStatusEnum.default("idea"),
  priority: priorityEnum.default("medium"),
  category: z.string().default(""),
  campaign: z.string().default(""),
  tags: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  aiGenerated: z.boolean().default(false),
  publishDate: z.string().datetime().nullable().optional(),
  publishTime: z.string().nullable().optional(),
  notes: z.string().default(""),
});
export type CreateContentPostDto = z.infer<typeof createContentPostSchema>;

export const updateContentPostSchema = createContentPostSchema.partial();
export type UpdateContentPostDto = z.infer<typeof updateContentPostSchema>;

export const contentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  platform: contentPlatformEnum.optional(),
  status: contentStatusEnum.optional(),
  favorite: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  search: z.string().optional(),
});
export type ContentQuery = z.infer<typeof contentQuerySchema>;
