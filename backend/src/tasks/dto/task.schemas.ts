import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.string().max(120).default(""),
  priority: priorityEnum.default("medium"),
  dueDate: z.string().datetime().nullable().optional(),
  completed: z.boolean().default(false),
});
export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  completed: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  category: z.string().optional(),
  priority: priorityEnum.optional(),
});
export type TaskQuery = z.infer<typeof taskQuerySchema>;
