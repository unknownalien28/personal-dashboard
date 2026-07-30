import { z } from "zod";

/**
 * `provider` is intentionally optional with no default here — if the
 * caller doesn't specify one, AiOrchestratorService resolves it from the
 * user's AISettings (Gemini by default for new users), falling back to
 * "demo" only if nothing else is configured. See resolveProvider().
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(8000, "Message is too long (max 8000 characters)."),
  provider: z.enum(["auto", "demo", "openai", "anthropic", "gemini", "ollama"]).optional(),
  model: z.string().max(120).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8000).optional(),
  moduleHints: z.array(z.string().max(300)).max(10).default([]),
});
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
