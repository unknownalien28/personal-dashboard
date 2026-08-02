export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  dueDate: string | null; // ISO date string
  completed: boolean;
  createdAt: string;
}

export type NoteColor = "default" | "yellow" | "blue" | "green" | "pink" | "purple";

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown source
  tags: string[];
  pinned: boolean;
  archived: boolean;
  deletedAt: string | null; // ISO timestamp when moved to trash, null if active
  color: NoteColor;
  createdAt: string;
  updatedAt: string;
}

export type EventColor = "default" | "yellow" | "blue" | "green" | "pink" | "purple";
export type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type ReminderOption = "none" | "atTime" | "5min" | "15min" | "30min" | "1hour" | "1day";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO date "YYYY-MM-DD"
  endDate: string; // ISO date "YYYY-MM-DD" — equals startDate for single-day events
  startTime: string | null; // "HH:mm", null when allDay
  endTime: string | null; // "HH:mm", null when allDay
  allDay: boolean;
  color: EventColor;
  category: string;
  location: string;
  reminder: ReminderOption;
  repeat: RepeatOption;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO date strings
  createdAt: string;
}

export type GoalStatus = "notStarted" | "inProgress" | "completed" | "onHold";

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  targetDate: string | null;
  progress: number; // 0-100
  manualProgress: boolean; // true once the person overrides the milestone-derived progress
  status: GoalStatus;
  color: NoteColor;
  icon: string; // key into the curated goal-icons list
  notes: string;
  milestones: Milestone[];
  archived: boolean;
  deletedAt: string | null; // ISO timestamp when moved to trash, null if active
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "cash" | "bank" | "savings" | "creditCard" | "investment" | "digitalWallet" | "custom";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: NoteColor;
  icon: string;
  currency: string;
  balance: number;
  openingBalance: number;
  notes: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // always a positive magnitude; direction comes from `type`
  category: string;
  accountId: string;
  transferToAccountId: string | null; // set only when type === "transfer"
  date: string; // "YYYY-MM-DD"
  time: string | null; // "HH:mm"
  notes: string;
  tags: string[];
  hasReceipt: boolean; // placeholder flag - no real image storage
  recurring: boolean;
  favorite: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: BudgetPeriod;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  reminder: ReminderOption;
  autoRepeat: RepeatOption;
  paid: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string; // ISO timestamp
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: NoteColor;
  icon: string;
  contributions: SavingsContribution[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentPlatform =
  | "x"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "threads"
  | "telegram"
  | "whatsapp"
  | "blog"
  | "custom";

export type ContentStatus = "idea" | "researching" | "writing" | "editing" | "scheduled" | "published" | "archived";

export interface ContentPost {
  id: string;
  title: string;
  description: string; // short idea-stage summary, separate from the full body
  body: string;
  platform: ContentPlatform;
  customPlatformName: string; // shown/used only when platform === "custom"
  hashtags: string[];
  mentions: string[];
  status: ContentStatus;
  priority: Priority;
  category: string;
  campaign: string;
  tags: string[];
  favorite: boolean;
  aiGenerated: boolean;
  publishDate: string | null; // ISO date "YYYY-MM-DD"
  publishTime: string | null; // "HH:mm"
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  name: string;
  role: string;
  avatarColor: string;
  avatarDataUrl: string | null;
  email: string;
  bio: string;
  timezone: string;
  language: string;
}

export type AccentColorKey = "alienBlue" | "cosmicPurple" | "auroraGreen" | "solarOrange" | "crimsonRed" | "sakuraPink";
export type FontSize = "small" | "medium" | "large";
export type StartupPage = "/" | "/tasks" | "/notes" | "/calendar" | "/goals";
export type NotesDefaultFilter = "all" | "pinned" | "archived" | "trash";
export type CalendarDefaultView = "month" | "week" | "day" | "agenda";
export type GoalDefaultView = "grid" | "list" | "kanban";

export interface AppearanceSettings {
  accentColor: AccentColorKey;
  fontSize: FontSize;
  compactMode: boolean;
  reducedMotion: boolean;
}

/** Independent toggles for the ambient space environment (Settings > Visual Effects). */
export interface VisualEffectsSettings {
  ambientBackground: boolean;
  floatingPlanets: boolean;
  starField: boolean;
  floatingParticles: boolean;
  mouseParallax: boolean;
  glowEffects: boolean;
  glassEffects: boolean;
  /** Master "lite" switch - dials every effect down at once, independent of the individual toggles above. */
  reducedVisualEffects: boolean;
}

export interface NotificationSettings {
  calendarReminders: boolean;
  goalReminders: boolean;
  taskReminders: boolean;
}

export interface PreferenceSettings {
  defaultCalendarView: CalendarDefaultView;
  defaultNotesFilter: NotesDefaultFilter;
  defaultGoalView: GoalDefaultView;
  startupPage: StartupPage;
}

/* ===========================================================================
   Alien Assistant - AI provider + conversation types
   =========================================================================== */

/**
 * Persisted locally as a fast-access cache and synced with the backend's
 * AISettings (GET /users/me, PATCH /users/me/settings/ai) — the backend is
 * the source of truth. No API key lives here: Gemini is AlienOS's only AI
 * provider, configured server-side only (see backend .env.example), and
 * the frontend never talks to it directly.
 */
export interface AISettings {
  enabled: boolean;
  model: string;
  streaming: boolean;
  temperature: number;
  maxTokens: number;
}

export type ChatRole = "user" | "assistant" | "system";
export type ChatMessageStatus = "complete" | "streaming" | "error";

export type ChatActionStatus = "executed" | "pending" | "confirmed" | "cancelled" | "failed";

export interface ChatAction {
  tool: string;
  args: Record<string, unknown>;
  status: ChatActionStatus;
  resultMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status: ChatMessageStatus;
  /** Present only when status is "error" - shown inline with a Retry action. */
  errorMessage?: string;
  /** Present when the assistant performed a tool action alongside its reply (executed server-side by the AI orchestration layer). */
  action?: ChatAction;
  /** Files the user attached to this message (uploaded via /storage/upload). Display-only metadata - the actual content (for text-like files) is inlined into the message sent to the backend by chat-service.ts, not re-derived from this. */
  attachments?: ChatAttachment[];
  createdAt: string;
}

export interface ChatAttachment {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  /** Whether this file's text content was read and included in what was sent to the AI (true for small text-like files), vs just referenced by name/link (large or binary files). */
  contentIncluded: boolean;
}

export interface Conversation {
  id: string;
  /** The authoritative backend Conversation id, once known. Undefined until the first message in this conversation gets a reply — see chat-service.ts. */
  backendId?: string;
  title: string;
  pinned: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
