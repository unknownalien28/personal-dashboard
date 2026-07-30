import { z } from "zod";
import { priorityEnum } from "../../tasks/dto/task.schemas";
import { noteColorEnum } from "../../notes/dto/note.schemas";

export const goalStatusEnum = z.enum(["notStarted", "inProgress", "completed", "onHold"]);

export const createGoalSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().default(""),
  category: z.string().default(""),
  priority: priorityEnum.default("medium"),
  targetDate: z.string().datetime().nullable().optional(),
  status: goalStatusEnum.default("notStarted"),
  color: noteColorEnum.default("default"),
  icon: z.string().default(""),
  notes: z.string().default(""),
});
export type CreateGoalDto = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema.partial().extend({
  progress: z.number().int().min(0).max(100).optional(),
  manualProgress: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;

export const goalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: goalStatusEnum.optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  trashed: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
export type GoalQuery = z.infer<typeof goalQuerySchema>;

export const createMilestoneSchema = z.object({
  title: z.string().min(1).max(300),
});
export type CreateMilestoneDto = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  completed: z.boolean().optional(),
});
export type UpdateMilestoneDto = z.infer<typeof updateMilestoneSchema>;
