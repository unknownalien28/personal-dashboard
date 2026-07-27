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

export interface Note {
  id: string;
  title: string;
  content: string; // HTML from the rich text editor
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time: string | null; // "HH:mm" or null for all-day
  type: "event" | "reminder" | "deadline";
  notes: string;
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
