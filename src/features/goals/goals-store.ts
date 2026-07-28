import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { Goal, GoalStatus, Habit, Milestone, NoteColor, Priority } from "@/types/models";

export interface GoalInput {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  targetDate: string | null;
  status: GoalStatus;
  color: NoteColor;
  icon: string;
  notes: string;
}

function recalcProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return Math.round((done / milestones.length) * 100);
}

interface GoalsState {
  // --- Habits (pre-existing, unrelated to this module, left untouched) ---
  habits: Habit[];
  addHabit: (name: string) => void;
  markHabitDoneToday: (id: string) => void;

  // --- Goals ---
  goals: Goal[];
  customCategories: string[];
  createGoal: (input: GoalInput) => string;
  updateGoal: (id: string, updates: Partial<GoalInput>) => void;
  duplicateGoal: (id: string) => string | null;
  archiveGoal: (id: string) => void;
  unarchiveGoal: (id: string) => void;
  softDeleteGoal: (id: string) => void;
  restoreGoal: (id: string) => void;
  permanentlyDeleteGoal: (id: string) => void;

  setManualProgress: (id: string, progress: number) => void;
  setAutoProgress: (id: string) => void;
  setStatus: (id: string, status: GoalStatus) => void;

  addMilestone: (goalId: string, title: string) => void;
  updateMilestone: (goalId: string, milestoneId: string, title: string) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  addCustomCategory: (name: string) => void;
}

function touchGoal(goal: Goal, updates: Partial<Goal>): Goal {
  return { ...goal, ...updates, updatedAt: new Date().toISOString() };
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (name) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: crypto.randomUUID(),
              name,
              streak: 0,
              bestStreak: 0,
              completedDates: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      markHabitDoneToday: (id) =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          return {
            habits: s.habits.map((h) => {
              if (h.id !== id || h.completedDates.includes(today)) return h;
              const newStreak = h.streak + 1;
              return {
                ...h,
                completedDates: [...h.completedDates, today],
                streak: newStreak,
                bestStreak: Math.max(h.bestStreak, newStreak),
              };
            }),
          };
        }),

      goals: [],
      customCategories: [],

      createGoal: (input) => {
        const now = new Date().toISOString();
        const goal: Goal = {
          ...input,
          id: crypto.randomUUID(),
          progress: 0,
          manualProgress: false,
          milestones: [],
          archived: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal.id;
      },

      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? touchGoal(g, updates) : g)),
        })),

      duplicateGoal: (id) => {
        const original = get().goals.find((g) => g.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Goal = {
          ...original,
          id: crypto.randomUUID(),
          title: original.title ? `${original.title} (copy)` : "",
          milestones: original.milestones.map((m) => ({ ...m, id: crypto.randomUUID(), completed: false })),
          progress: original.manualProgress ? original.progress : 0,
          status: "notStarted",
          archived: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ goals: [...s.goals, copy] }));
        return copy.id;
      },

      archiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? touchGoal(g, { archived: true }) : g)) })),

      unarchiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? touchGoal(g, { archived: false }) : g)) })),

      softDeleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? touchGoal(g, { deletedAt: new Date().toISOString() }) : g)),
        })),

      restoreGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? touchGoal(g, { deletedAt: null }) : g)) })),

      permanentlyDeleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      setManualProgress: (id, progress) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? touchGoal(g, { progress: Math.max(0, Math.min(100, progress)), manualProgress: true }) : g
          ),
        })),

      setAutoProgress: (id) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? touchGoal(g, { manualProgress: false, progress: recalcProgress(g.milestones) }) : g
          ),
        })),

      setStatus: (id, status) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const updates: Partial<Goal> = { status };
            if (status === "completed" && !g.manualProgress) updates.progress = 100;
            return touchGoal(g, updates);
          }),
        })),

      addMilestone: (goalId, title) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = [
              ...g.milestones,
              { id: crypto.randomUUID(), title, completed: false, createdAt: new Date().toISOString() },
            ];
            return touchGoal(g, { milestones, progress: g.manualProgress ? g.progress : recalcProgress(milestones) });
          }),
        })),

      updateMilestone: (goalId, milestoneId, title) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? touchGoal(g, { milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, title } : m)) })
              : g
          ),
        })),

      deleteMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.filter((m) => m.id !== milestoneId);
            return touchGoal(g, { milestones, progress: g.manualProgress ? g.progress : recalcProgress(milestones) });
          }),
        })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            );
            return touchGoal(g, { milestones, progress: g.manualProgress ? g.progress : recalcProgress(milestones) });
          }),
        })),

      addCustomCategory: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.customCategories.includes(trimmed)) return s;
          return { customCategories: [...s.customCategories, trimmed] };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}goals`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
