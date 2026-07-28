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

export interface Goal {
  id: string;
  title: string;
  targetDate: string | null;
  progress: number; // 0-100
  createdAt: string;
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
}
