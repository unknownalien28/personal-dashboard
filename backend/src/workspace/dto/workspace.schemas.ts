import { z } from "zod";

export const createWorkspaceDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().default(""),
  mimeType: z.string().default("text/markdown"),
  folder: z.string().default(""),
  tags: z.array(z.string()).default([]),
});
export type CreateWorkspaceDocumentDto = z.infer<typeof createWorkspaceDocumentSchema>;

export const updateWorkspaceDocumentSchema = createWorkspaceDocumentSchema.partial().extend({
  archived: z.boolean().optional(),
});
export type UpdateWorkspaceDocumentDto = z.infer<typeof updateWorkspaceDocumentSchema>;

export const workspaceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  folder: z.string().optional(),
  archived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  search: z.string().optional(),
});
export type WorkspaceQuery = z.infer<typeof workspaceQuerySchema>;
