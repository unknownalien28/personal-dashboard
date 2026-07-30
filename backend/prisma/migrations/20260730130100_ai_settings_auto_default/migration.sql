-- "auto" (Gemini -> Ollama -> OpenAI -> Anthropic -> Demo) becomes the
-- default provider mode for new users. Existing rows are untouched — this
-- only changes the DEFAULT applied to future inserts.
ALTER TABLE "ai_settings" ALTER COLUMN "provider" SET DEFAULT 'auto';
