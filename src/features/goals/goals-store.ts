import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { Habit, Goal } from "@/types/models";

interface GoalsState {
  habits: Habit[];
  goals: Goal[];
  addHabit: (name: string) => void;
  markHabitDoneToday: (id: string) => void;
  addGoal: (goal: Pick<Goal, "title" | "targetDate">) => void;
  updateGoalProgress: (id: string, progress: number) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      habits: [],
      goals: [],
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
      addGoal: (goal) =>
        set((s) => ({
          goals: [
            ...s.goals,
            { ...goal, id: crypto.randomUUID(), progress: 0, createdAt: new Date().toISOString() },
          ],
        })),
      updateGoalProgress: (id, progress) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, progress } : g)),
        })),
    }),
    {
      name: `${STORAGE_PREFIX}goals`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
