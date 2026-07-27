import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { Note, NoteColor } from "@/types/models";

interface CreateNoteInput {
  title?: string;
  content?: string;
  color?: NoteColor;
}

interface NotesState {
  notes: Note[];
  createNote: (input?: CreateNoteInput) => string;
  updateNote: (id: string, updates: Partial<Pick<Note, "title" | "content" | "color" | "tags">>) => void;
  togglePin: (id: string) => void;
  duplicateNote: (id: string) => string | null;
  archiveNote: (id: string) => void;
  unarchiveNote: (id: string) => void;
  softDeleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDeleteNote: (id: string) => void;
  emptyTrash: () => void;
}

function makeNote(input?: CreateNoteInput): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: input?.title ?? "",
    content: input?.content ?? "",
    tags: [],
    pinned: false,
    archived: false,
    deletedAt: null,
    color: input?.color ?? "default",
    createdAt: now,
    updatedAt: now,
  };
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      createNote: (input) => {
        const note = makeNote(input);
        set((s) => ({ notes: [note, ...s.notes] }));
        return note.id;
      },

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

      duplicateNote: (id) => {
        const original = get().notes.find((n) => n.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Note = {
          ...original,
          id: crypto.randomUUID(),
          title: original.title ? `${original.title} (copy)` : "",
          pinned: false,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => {
          const idx = s.notes.findIndex((n) => n.id === id);
          const next = [...s.notes];
          next.splice(idx + 1, 0, copy);
          return { notes: next };
        });
        return copy.id;
      },

      archiveNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, archived: true, pinned: false } : n)),
        })),

      unarchiveNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, archived: false } : n)),
        })),

      softDeleteNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, deletedAt: new Date().toISOString(), pinned: false } : n
          ),
        })),

      restoreNote: (id) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, deletedAt: null } : n)),
        })),

      permanentlyDeleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      emptyTrash: () => set((s) => ({ notes: s.notes.filter((n) => !n.deletedAt) })),
    }),
    {
      name: `${STORAGE_PREFIX}notes`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
