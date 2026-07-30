import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

const MAX_RECENTS = 6;

interface CommandPaletteState {
  recentIds: string[];
  pinnedIds: string[];
  recordUsed: (id: string) => void;
  togglePinned: (id: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()(
  persist(
    (set) => ({
      recentIds: [],
      pinnedIds: [],
      recordUsed: (id) =>
        set((s) => ({ recentIds: [id, ...s.recentIds.filter((existing) => existing !== id)].slice(0, MAX_RECENTS) })),
      togglePinned: (id) =>
        set((s) => ({
          pinnedIds: s.pinnedIds.includes(id) ? s.pinnedIds.filter((existing) => existing !== id) : [...s.pinnedIds, id],
        })),
    }),
    {
      name: `${STORAGE_PREFIX}command-palette`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
