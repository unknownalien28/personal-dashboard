-- Phase 2: Gemini becomes the default AI provider for all new users, and
-- AI Settings gains a master enable/disable switch.

-- Existing rows keep whatever provider they already had; only the column
-- DEFAULT (used for future INSERTs where no value is supplied) changes.
ALTER TABLE "ai_settings" ALTER COLUMN "provider" SET DEFAULT 'gemini';

ALTER TABLE "ai_settings" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
