import { z } from "zod";

export const eventColorEnum = z.enum(["default", "yellow", "blue", "green", "pink", "purple"]);
export const repeatOptionEnum = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);
export const reminderOptionEnum = z.enum(["none", "atTime", "min5", "min15", "min30", "hour1", "day1"]);

export const createEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().default(""),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  allDay: z.boolean().default(false),
  color: eventColorEnum.default("default"),
  category: z.string().default(""),
  location: z.string().default(""),
  reminder: reminderOptionEnum.default("none"),
  repeat: repeatOptionEnum.default("none"),
  archived: z.boolean().default(false),
});
export type CreateEventDto = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventDto = z.infer<typeof updateEventSchema>;

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type EventQuery = z.infer<typeof eventQuerySchema>;

export const createHabitSchema = z.object({
  name: z.string().min(1).max(200),
});
export type CreateHabitDto = z.infer<typeof createHabitSchema>;

export const toggleHabitDateSchema = z.object({
  date: z.string().datetime(),
});
export type ToggleHabitDateDto = z.infer<typeof toggleHabitDateSchema>;
