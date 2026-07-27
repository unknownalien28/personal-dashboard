import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      toggle: () => set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: `${STORAGE_PREFIX}theme`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
