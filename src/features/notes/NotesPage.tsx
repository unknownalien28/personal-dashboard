import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotesStore } from "@/features/notes/notes-store";
import { NoteCard, type NoteCardMode } from "@/features/notes/components/NoteCard";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import { NoteFilterSidebar, type NoteFilter } from "@/features/notes/components/NoteFilterSidebar";
import { NoteSortSelect, type NoteSort } from "@/features/notes/components/NoteSortSelect";
import type { Note } from "@/types/models";

interface NavState {
  noteId?: string;
}

function matchesSearch(note: Note, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
}

function sortNotes(notes: Note[], sort: NoteSort): Note[] {
  const list = [...notes];
  switch (sort) {
    case "created":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "title":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "pinnedFirst":
      return list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    case "updated":
    default:
      return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

function filterModeFor(filter: NoteFilter): NoteCardMode {
  if (filter === "trash") return "trash";
  if (filter === "archived") return "archived";
  return "active";
}

export function NotesPage() {
  const {
    notes,
    createNote,
    updateNote,
    togglePin,
    duplicateNote,
    archiveNote,
    unarchiveNote,
    softDeleteNote,
    restoreNote,
    permanentlyDeleteNote,
  } = useNotesStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [sort, setSort] = useState<NoteSort>("updated");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Arriving from Home's "Continue Writing" card via router state.
  useEffect(() => {
    const state = location.state as NavState | null;
    if (state?.noteId) {
      setSelectedId(state.noteId);
      setFilter("all");
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+N new note, Cmd/Ctrl+F focus search.
  // (Cmd/Ctrl+S is handled locally by NoteEditor, scoped to the open note.)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreate();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const active = notes.filter((n) => !n.deletedAt && !n.archived);
    return {
      all: active.length,
      pinned: active.filter((n) => n.pinned).length,
      archived: notes.filter((n) => !n.deletedAt && n.archived).length,
      trash: notes.filter((n) => !!n.deletedAt).length,
    };
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const filtered = notes.filter((n) => {
      if (filter === "trash") return !!n.deletedAt;
      if (n.deletedAt) return false;
      if (filter === "archived") return n.archived;
      if (n.archived) return false;
      if (filter === "pinned") return n.pinned;
      return true;
    });
    return sortNotes(filtered.filter((n) => matchesSearch(n, search)), sort);
  }, [notes, filter, search, sort]);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) ?? null, [notes, selectedId]);
  const mode = filterModeFor(filter);

  function handleCreate() {
    const id = createNote();
    setFilter("all");
    setSelectedId(id);
  }

  function handleDuplicate(id: string) {
    const newId = duplicateNote(id);
    if (newId) setSelectedId(newId);
  }

  function handleArchive(id: string) {
    archiveNote(id);
    if (selectedId === id) setSelectedId(null);
  }

  function handleUnarchive(id: string) {
    unarchiveNote(id);
    if (selectedId === id) setSelectedId(null);
  }

  function handleSoftDelete(id: string) {
    softDeleteNote(id);
    if (selectedId === id) setSelectedId(null);
  }

  function handleRestore(id: string) {
    restoreNote(id);
    if (selectedId === id) setSelectedId(null);
  }

  function handlePermanentDelete(id: string) {
    if (selectedId === id) setSelectedId(null);
    permanentlyDeleteNote(id);
  }

  function actionsFor(note: Note) {
    return {
      onTogglePin: mode === "active" ? () => togglePin(note.id) : undefined,
      onArchive: mode === "active" ? () => handleArchive(note.id) : undefined,
      onUnarchive: mode === "archived" ? () => handleUnarchive(note.id) : undefined,
      onSoftDelete: mode !== "trash" ? () => handleSoftDelete(note.id) : undefined,
      onRestore: mode === "trash" ? () => handleRestore(note.id) : undefined,
      onPermanentDelete: mode === "trash" ? () => handlePermanentDelete(note.id) : undefined,
      onDuplicate: mode === "active" ? () => handleDuplicate(note.id) : undefined,
    };
  }

  const listPane = (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 md:hidden">Notes</h2>
        <NoteSortSelect value={sort} onChange={setSort} />
      </div>

      {visibleNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 gap-3 empty-state-in">
          <div className="h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
            <StickyNote className="h-6 w-6 text-accent-500" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            {notes.length === 0 ? "No notes yet. Create your first one." : "No notes match this view."}
          </p>
          {notes.length === 0 && (
            <Button variant="primary" onClick={handleCreate}>
              <Plus className="h-4 w-4" /> New note
            </Button>
          )}
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-2.5">
          {visibleNotes.map((note, i) => (
            <li key={note.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
              <NoteCard
                note={note}
                selected={note.id === selectedId}
                mode={mode}
                onSelect={() => setSelectedId(note.id)}
                {...actionsFor(note)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0 md:h-[calc(100vh-8.5rem)]">
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Notes</h2>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4" /> New note
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:flex-1 gap-5 md:min-h-0">
        {/* Desktop sidebar: search, filters, counts */}
        <div className="md:w-56 shrink-0">
          <NoteFilterSidebar
            ref={searchInputRef}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
        </div>

        {/* Center: list. Hidden on mobile once a note is open (full-screen editor takes over). */}
        <div className={selectedNote ? "hidden md:block md:w-80 md:shrink-0 md:overflow-y-auto" : "md:w-80 md:shrink-0 md:overflow-y-auto"}>
          {listPane}
        </div>

        {/* Right: editor. Desktop: inline pane. Mobile: full-screen overlay when a note is selected. */}
        {selectedNote ? (
          <div className="flex-1 md:min-w-0 md:border md:border-[var(--color-border)] md:rounded-xl md:p-5 md:overflow-y-auto">
            <NoteEditor
              note={selectedNote}
              mode={mode}
              fullScreenOnMobile
              onBack={() => setSelectedId(null)}
              onUpdate={(updates) => updateNote(selectedNote.id, updates)}
              {...actionsFor(selectedNote)}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-500 border border-dashed border-[var(--color-border)] rounded-xl">
            Select a note to view it here, or create a new one.
          </div>
        )}
      </div>

      {/* Mobile floating action button */}
      {!selectedNote && (
        <button
          onClick={handleCreate}
          aria-label="New note"
          className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
