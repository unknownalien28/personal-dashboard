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

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date string
}

export type ContentStatus = "idea" | "draft" | "scheduled" | "posted";

export interface ContentPost {
  id: string;
  title: string;
  platform: string;
  status: ContentStatus;
  scheduledDate: string | null;
  notes: string;
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

export type AccentColorKey = "indigo" | "blue" | "green" | "rose" | "orange" | "violet";
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
