import { useNotesStore } from "@/features/notes/notes-store";
import { parseMarkdownLines, stripMarkdown } from "@/features/notes/markdown";
import { ok, fail, type ToolResult } from "./types";
import type { Note, NoteColor } from "@/types/models";

function activeNotes(): Note[] {
  return useNotesStore.getState().notes.filter((n) => !n.deletedAt && !n.archived);
}

function findByTitle(query: string): Note | undefined {
  const q = query.trim().toLowerCase();
  return activeNotes().find((n) => n.title.toLowerCase().includes(q));
}

export function getNotes(): ToolResult<Note[]> {
  const notes = activeNotes();
  return ok(`Found ${notes.length} note(s).`, notes);
}

export function searchNotes(query: string): ToolResult<Note[]> {
  const q = query.trim().toLowerCase();
  const results = activeNotes().filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q))
  );
  return ok(`Found ${results.length} note(s) matching "${query}".`, results);
}

/** Extractive summary (first couple of meaningful lines per note) - genuinely useful without a model round-trip, and used to seed context for a fuller LLM-written summary. */
export function summarizeNotes(query: string): ToolResult<{ note: Note; preview: string }[]> {
  const matches = query.trim() ? searchNotes(query).data ?? [] : activeNotes();
  const summaries = matches.slice(0, 8).map((note) => ({
    note,
    preview: stripMarkdown(note.content).slice(0, 220),
  }));
  return ok(`Summarized ${summaries.length} note(s).`, summaries);
}

/** Scans for checklist lines and common action-item phrasing across matching notes. */
export function extractActionItems(query = ""): ToolResult<{ noteTitle: string; noteId: string; item: string }[]> {
  const matches = query.trim() ? searchNotes(query).data ?? [] : activeNotes();
  const actionVerbPattern = /^(todo|to do|action|follow[- ]?up|need to|must|should)\b/i;
  const items: { noteTitle: string; noteId: string; item: string }[] = [];

  for (const note of matches) {
    for (const line of parseMarkdownLines(note.content)) {
      if (line.type === "checklist" && !line.checked) {
        items.push({ noteTitle: note.title || "Untitled", noteId: note.id, item: line.text });
      } else if (line.type === "paragraph" || line.type === "bullet") {
        if (actionVerbPattern.test(line.text.trim())) {
          items.push({ noteTitle: note.title || "Untitled", noteId: note.id, item: line.text });
        }
      }
    }
  }
  return ok(`Found ${items.length} action item(s).`, items);
}

export function generateTitle(content: string): ToolResult<string> {
  const firstLine = stripMarkdown(content).split("\n").find((l) => l.trim().length > 0) ?? "";
  const title = firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || "Untitled note";
  return ok(`Suggested title: "${title}".`, title);
}

export interface CreateNoteArgs {
  title?: string;
  content: string;
  color?: NoteColor;
}

export function createNote(args: CreateNoteArgs): ToolResult<Note> {
  if (!args.content?.trim()) return fail("A note needs some content.");
  const title = args.title?.trim() || (generateTitle(args.content).data as string);
  const id = useNotesStore.getState().createNote({ title, content: args.content, color: args.color });
  const created = useNotesStore.getState().notes.find((n) => n.id === id);
  return ok(`Created note "${title}".`, created);
}

export function updateNote(idOrTitle: string, updates: Partial<Pick<Note, "title" | "content" | "color" | "tags">>): ToolResult<Note> {
  const note = activeNotes().find((n) => n.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!note) return fail(`Couldn't find a note matching "${idOrTitle}".`);
  useNotesStore.getState().updateNote(note.id, updates);
  return ok(`Updated "${note.title || "Untitled"}".`, { ...note, ...updates });
}

export function deleteNote(idOrTitle: string): ToolResult<{ id: string }> {
  const note = activeNotes().find((n) => n.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!note) return fail(`Couldn't find a note matching "${idOrTitle}".`);
  useNotesStore.getState().softDeleteNote(note.id);
  return ok(`Moved "${note.title || "Untitled"}" to Trash.`, { id: note.id });
}
