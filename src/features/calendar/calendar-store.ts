import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { CalendarEvent, EventColor, ReminderOption, RepeatOption } from "@/types/models";

export interface EventInput {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  color: EventColor;
  category: string;
  location: string;
  reminder: ReminderOption;
  repeat: RepeatOption;
}

interface CalendarState {
  events: CalendarEvent[];
  customCategories: string[];
  createEvent: (input: EventInput) => string;
  updateEvent: (id: string, updates: Partial<EventInput>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => string | null;
  archiveEvent: (id: string) => void;
  unarchiveEvent: (id: string) => void;
  addCustomCategory: (name: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      events: [],
      customCategories: [],

      createEvent: (input) => {
        const now = new Date().toISOString();
        const event: CalendarEvent = {
          ...input,
          id: crypto.randomUUID(),
          archived: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ events: [...s.events, event] }));
        return event.id;
      },

      updateEvent: (id, updates) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),

      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      duplicateEvent: (id) => {
        const original = get().events.find((e) => e.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: CalendarEvent = {
          ...original,
          id: crypto.randomUUID(),
          title: original.title ? `${original.title} (copy)` : "",
          archived: false,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ events: [...s.events, copy] }));
        return copy.id;
      },

      archiveEvent: (id) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, archived: true } : e)) })),

      unarchiveEvent: (id) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, archived: false } : e)) })),

      addCustomCategory: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.customCategories.includes(trimmed)) return s;
          return { customCategories: [...s.customCategories, trimmed] };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}calendar`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
