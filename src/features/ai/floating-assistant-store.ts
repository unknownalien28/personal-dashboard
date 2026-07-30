import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

/**
 * State for the floating AI panel available from every page (Phase 6, Part 1).
 * Only `isOpen` is persisted, per the spec - a minimized panel or drag
 * position resuming across a fresh visit would feel like clutter the user
 * didn't ask for, but whether they had the assistant open at all is worth
 * remembering.
 */
interface FloatingAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  restore: () => void;
}

export const useFloatingAssistantStore = create<FloatingAssistantState>()(
  persist(
    (set) => ({
      isOpen: false,
      isMinimized: false,
      open: () => set({ isOpen: true, isMinimized: false }),
      close: () => set({ isOpen: false, isMinimized: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen, isMinimized: false })),
      minimize: () => set({ isMinimized: true }),
      restore: () => set({ isMinimized: false }),
    }),
    {
      name: `${STORAGE_PREFIX}floating-assistant`,
      storage: createJSONStorage(() => storageAdapter),
      partialize: (s) => ({ isOpen: s.isOpen }),
    }
  )
);
