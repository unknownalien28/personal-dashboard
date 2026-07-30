import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

export type ThemeMode = "light" | "dark" | "system";

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

interface ThemeState {
  mode: ThemeMode;
  /** Quick light<->dark toggle used by the topbar button; resolves "system" to its current value first. */
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      toggle: () =>
        set((s) => {
          const resolved = s.mode === "system" ? (systemPrefersDark() ? "dark" : "light") : s.mode;
          return { mode: resolved === "light" ? "dark" : "light" };
        }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: `${STORAGE_PREFIX}theme`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
