-- Phase 2 (hybrid architecture): add "auto" as a selectable AI provider mode.
-- Kept in its own migration/transaction because PostgreSQL requires a new
-- enum value to be committed before it can be referenced (e.g. as a column
-- DEFAULT) in a later statement.
ALTER TYPE "AIProviderKey" ADD VALUE 'auto';
