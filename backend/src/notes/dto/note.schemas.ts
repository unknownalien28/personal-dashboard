import { z } from "zod";

export const noteColorEnum = z.enum(["default", "yellow", "blue", "green", "pink", "purple"]);

export const createNoteSchema = z.object({
  title: z.string().max(300).default(""),
  content: z.string().default(""),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  color: noteColorEnum.default("default"),
});
export type CreateNoteDto = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial();
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;

export const noteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filter: z.enum(["all", "pinned", "archived", "trash"]).default("all"),
  search: z.string().optional(),
});
export type NoteQuery = z.infer<typeof noteQuerySchema>;
