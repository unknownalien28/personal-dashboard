import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(300).default("New conversation"),
});
export type CreateConversationDto = z.infer<typeof createConversationSchema>;

export const updateConversationSchema = z.object({
  title: z.string().max(300).optional(),
  pinned: z.boolean().optional(),
});
export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;

export const chatRoleEnum = z.enum(["user", "assistant", "system"]);
export const chatMessageStatusEnum = z.enum(["complete", "streaming", "error"]);
export const chatActionStatusEnum = z.enum(["executed", "pending", "confirmed", "cancelled", "failed"]);

export const createMessageSchema = z.object({
  role: chatRoleEnum,
  content: z.string(),
  status: chatMessageStatusEnum.default("complete"),
  errorMessage: z.string().optional(),
  action: z
    .object({
      tool: z.string(),
      args: z.record(z.unknown()),
      status: chatActionStatusEnum,
      resultMessage: z.string().optional(),
    })
    .optional(),
});
export type CreateMessageDto = z.infer<typeof createMessageSchema>;

export const updateMessageSchema = z.object({
  content: z.string().optional(),
  status: chatMessageStatusEnum.optional(),
  errorMessage: z.string().optional(),
  actionStatus: chatActionStatusEnum.optional(),
  actionResult: z.string().optional(),
});
export type UpdateMessageDto = z.infer<typeof updateMessageSchema>;
