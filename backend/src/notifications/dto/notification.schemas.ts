import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().default(""),
  category: z.string().default("general"),
  link: z.string().nullable().optional(),
});
export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

export const bulkMarkReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type BulkMarkReadDto = z.infer<typeof bulkMarkReadSchema>;
