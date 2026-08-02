-- Architecture simplification: Gemini is now AlienOS's only AI provider
-- (see MIGRATION_REPORT_2026-08-02-single-provider.md). A per-user "which
-- provider" preference is meaningless with only one provider to choose
-- from, so this drops the column and the enum type entirely rather than
-- leaving dead, unused state around.
ALTER TABLE "ai_settings" DROP COLUMN "provider";
DROP TYPE "AIProviderKey";
