import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(8000, "Message is too long (max 8000 characters)."),
  /** Overrides the configured Gemini model (AI_GEMINI_MODEL / AISettings.model) for this one request. */
  model: z.string().max(120).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8000).optional(),
  moduleHints: z.array(z.string().max(300)).max(10).default([]),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
