import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1),
  provider: z.enum(["demo", "openai", "anthropic", "gemini", "ollama"]).default("demo"),
  moduleHints: z.array(z.string()).default([]),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
