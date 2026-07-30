-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccentColorKey" AS ENUM ('alienBlue', 'cosmicPurple', 'auroraGreen', 'solarOrange', 'crimsonRed', 'sakuraPink');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "StartupPage" AS ENUM ('home', 'tasks', 'notes', 'calendar', 'goals');

-- CreateEnum
CREATE TYPE "NotesDefaultFilter" AS ENUM ('all', 'pinned', 'archived', 'trash');

-- CreateEnum
CREATE TYPE "CalendarDefaultView" AS ENUM ('month', 'week', 'day', 'agenda');

-- CreateEnum
CREATE TYPE "GoalDefaultView" AS ENUM ('grid', 'list', 'kanban');

-- CreateEnum
CREATE TYPE "AIProviderKey" AS ENUM ('demo', 'openai', 'anthropic', 'gemini', 'ollama');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "NoteColor" AS ENUM ('default', 'yellow', 'blue', 'green', 'pink', 'purple');

-- CreateEnum
CREATE TYPE "EventColor" AS ENUM ('default', 'yellow', 'blue', 'green', 'pink', 'purple');

-- CreateEnum
CREATE TYPE "RepeatOption" AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "ReminderOption" AS ENUM ('none', 'atTime', 'min5', 'min15', 'min30', 'hour1', 'day1');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('notStarted', 'inProgress', 'completed', 'onHold');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('cash', 'bank', 'savings', 'creditCard', 'investment', 'digitalWallet', 'custom');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense', 'transfer');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('weekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('x', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'threads', 'telegram', 'whatsapp', 'blog', 'custom');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('idea', 'researching', 'writing', 'editing', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "AttachmentParent" AS ENUM ('note', 'workspaceDocument');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('complete', 'streaming', 'error');

-- CreateEnum
CREATE TYPE "ChatActionStatus" AS ENUM ('executed', 'pending', 'confirmed', 'cancelled', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationTokenHash" TEXT,
    "emailVerificationExpiresAt" TIMESTAMP(3),
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "avatarColor" TEXT NOT NULL DEFAULT '',
    "avatarDataUrl" TEXT,
    "email" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appearance_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accentColor" "AccentColorKey" NOT NULL DEFAULT 'alienBlue',
    "fontSize" "FontSize" NOT NULL DEFAULT 'medium',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "appearance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visual_effects_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ambientBackground" BOOLEAN NOT NULL DEFAULT true,
    "floatingPlanets" BOOLEAN NOT NULL DEFAULT true,
    "starField" BOOLEAN NOT NULL DEFAULT true,
    "floatingParticles" BOOLEAN NOT NULL DEFAULT true,
    "mouseParallax" BOOLEAN NOT NULL DEFAULT true,
    "glowEffects" BOOLEAN NOT NULL DEFAULT true,
    "glassEffects" BOOLEAN NOT NULL DEFAULT true,
    "reducedVisualEffects" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "visual_effects_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarReminders" BOOLEAN NOT NULL DEFAULT true,
    "goalReminders" BOOLEAN NOT NULL DEFAULT true,
    "taskReminders" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultCalendarView" "CalendarDefaultView" NOT NULL DEFAULT 'month',
    "defaultNotesFilter" "NotesDefaultFilter" NOT NULL DEFAULT 'all',
    "defaultGoalView" "GoalDefaultView" NOT NULL DEFAULT 'grid',
    "startupPage" "StartupPage" NOT NULL DEFAULT 'home',

    CONSTRAINT "preference_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AIProviderKey" NOT NULL DEFAULT 'demo',
    "model" TEXT NOT NULL DEFAULT '',
    "streaming" BOOLEAN NOT NULL DEFAULT true,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1024,

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "color" "NoteColor" NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" "EventColor" NOT NULL DEFAULT 'default',
    "category" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "reminder" "ReminderOption" NOT NULL DEFAULT 'none',
    "repeat" "RepeatOption" NOT NULL DEFAULT 'none',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "completedDates" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "targetDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "manualProgress" BOOLEAN NOT NULL DEFAULT false,
    "status" "GoalStatus" NOT NULL DEFAULT 'notStarted',
    "color" "NoteColor" NOT NULL DEFAULT 'default',
    "icon" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL DEFAULT 'cash',
    "color" "NoteColor" NOT NULL DEFAULT 'default',
    "icon" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "accountId" TEXT NOT NULL,
    "transferToAccountId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasReceipt" BOOLEAN NOT NULL DEFAULT false,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "period" "BudgetPeriod" NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(18,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reminder" "ReminderOption" NOT NULL DEFAULT 'none',
    "autoRepeat" "RepeatOption" NOT NULL DEFAULT 'none',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_contributions" (
    "id" TEXT NOT NULL,
    "savingsGoalId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "currentAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "color" "NoteColor" NOT NULL DEFAULT 'default',
    "icon" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "platform" "ContentPlatform" NOT NULL DEFAULT 'x',
    "customPlatformName" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'idea',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT '',
    "campaign" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3),
    "publishTime" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "mimeType" TEXT NOT NULL DEFAULT 'text/markdown',
    "folder" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentType" "AttachmentParent" NOT NULL,
    "noteId" TEXT,
    "workspaceDocumentId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'complete',
    "errorMessage" TEXT,
    "actionTool" TEXT,
    "actionArgs" JSONB,
    "actionStatus" "ChatActionStatus",
    "actionResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "appearance_settings_userId_key" ON "appearance_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "visual_effects_settings_userId_key" ON "visual_effects_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "preference_settings_userId_key" ON "preference_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_settings_userId_key" ON "ai_settings"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "habits_userId_idx" ON "habits"("userId");

-- CreateIndex
CREATE INDEX "milestones_goalId_idx" ON "milestones"("goalId");

-- CreateIndex
CREATE INDEX "goals_userId_idx" ON "goals"("userId");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_accountId_idx" ON "transactions"("accountId");

-- CreateIndex
CREATE INDEX "budgets_userId_idx" ON "budgets"("userId");

-- CreateIndex
CREATE INDEX "bills_userId_idx" ON "bills"("userId");

-- CreateIndex
CREATE INDEX "savings_contributions_savingsGoalId_idx" ON "savings_contributions"("savingsGoalId");

-- CreateIndex
CREATE INDEX "savings_goals_userId_idx" ON "savings_goals"("userId");

-- CreateIndex
CREATE INDEX "content_posts_userId_idx" ON "content_posts"("userId");

-- CreateIndex
CREATE INDEX "workspace_documents_userId_idx" ON "workspace_documents"("userId");

-- CreateIndex
CREATE INDEX "attachments_userId_idx" ON "attachments"("userId");

-- CreateIndex
CREATE INDEX "attachments_noteId_idx" ON "attachments"("noteId");

-- CreateIndex
CREATE INDEX "attachments_workspaceDocumentId_idx" ON "attachments"("workspaceDocumentId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appearance_settings" ADD CONSTRAINT "appearance_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_effects_settings" ADD CONSTRAINT "visual_effects_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_settings" ADD CONSTRAINT "preference_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transferToAccountId_fkey" FOREIGN KEY ("transferToAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "savings_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_documents" ADD CONSTRAINT "workspace_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_workspaceDocumentId_fkey" FOREIGN KEY ("workspaceDocumentId") REFERENCES "workspace_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
