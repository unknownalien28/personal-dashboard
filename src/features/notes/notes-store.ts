import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { Note } from "@/types/models";

interface NotesState {
  notes: Note[];
  addNote: (note: Pick<Note, "title" | "content" | "tags">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  togglePin: (id: string) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) =>
        set((s) => ({
          notes: [
            ...s.notes,
            {
              ...note,
              id: crypto.randomUUID(),
              pinned: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),
      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),
      togglePin: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    {
      name: `${STORAGE_PREFIX}notes`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
