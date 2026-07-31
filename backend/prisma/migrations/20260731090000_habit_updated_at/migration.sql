-- Phase 9 hardening: `habits` was the only mutable domain table missing an
-- `updatedAt` audit column (streak/bestStreak/completedDates all change in
-- place when a habit is checked off, but that never showed up anywhere).
--
-- Backfill existing rows to their `createdAt` value so "last updated" isn't
-- misleadingly reported as "right now" for rows that predate this column;
-- Prisma's `@updatedAt` takes over automatically for every write from here on.
ALTER TABLE "habits" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "habits" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "habits" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "habits" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
