import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Pin,
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  RotateCcw,
  XCircle,
  Eye,
  Pencil,
} from "lucide-react";
import { MarkdownPreview } from "@/features/notes/components/MarkdownPreview";
import { noteColors, noteColorConfig } from "@/features/notes/color-config";
import { countWords, toggleChecklistLine } from "@/features/notes/markdown";
import type { Note, NoteColor } from "@/types/models";
import type { NoteCardMode } from "@/features/notes/components/NoteCard";
import { cn } from "@/lib/utils/cn";

interface NoteEditorProps {
  note: Note;
  mode: NoteCardMode;
  fullScreenOnMobile?: boolean;
  onBack?: () => void;
  onUpdate: (updates: Partial<Pick<Note, "title" | "content" | "color">>) => void;
  onTogglePin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDuplicate?: () => void;
  onSoftDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

const AUTOSAVE_DELAY = 600;

export function NoteEditor({
  note,
  mode,
  fullScreenOnMobile,
  onBack,
  onUpdate,
  onTogglePin,
  onArchive,
  onUnarchive,
  onDuplicate,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}: NoteEditorProps) {
  const readOnly = mode === "trash";
  const titleRef = useRef<HTMLInputElement>(null);

  const [localTitle, setLocalTitle] = useState(note.title);
  const [localContent, setLocalContent] = useState(note.content);
  const [showPreview, setShowPreview] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Reset local editing state whenever a different note is opened.
  useEffect(() => {
    setLocalTitle(note.title);
    setLocalContent(note.content);
    setShowPreview(false);
    if (!note.title && !note.content) {
      titleRef.current?.focus();
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = localTitle !== note.title || localContent !== note.content;

  function commit() {
    if (localTitle !== note.title || localContent !== note.content) {
      onUpdate({ title: localTitle, content: localContent });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  }

  useEffect(() => {
    if (!isDirty || readOnly) return;
    const timer = setTimeout(commit, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTitle, localContent]);

  // Ctrl/Cmd+S forces an immediate save of this note.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        commit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  function handleToggleCheckbox(lineIndex: number) {
    const updated = toggleChecklistLine(localContent, lineIndex);
    setLocalContent(updated);
    onUpdate({ content: updated });
  }

  function handleColorSelect(color: NoteColor) {
    onUpdate({ color });
  }

  const wordCount = countWords(localContent);
  const charCount = localContent.length;

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--color-canvas)] md:bg-transparent",
        fullScreenOnMobile && "fixed inset-0 z-40 md:relative md:inset-auto md:z-auto panel-slide-in"
      )}
      role="region"
      aria-label="Note editor"
    >
      {/* Header / toolbar */}
      <div className="flex items-center gap-1 px-3 md:px-0 h-14 md:h-auto md:pb-3 border-b md:border-b-0 border-[var(--color-border)] pt-[env(safe-area-inset-top)] md:pt-0 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to notes list"
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <div
          className="flex-1 text-xs text-zinc-400 dark:text-zinc-500 px-2"
          role="status"
          aria-live="polite"
        >
          {readOnly ? "In Trash — read only" : isDirty ? "Unsaved changes" : justSaved ? "Saved" : ""}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowPreview((v) => !v)}
            aria-label={showPreview ? "Switch to edit mode" : "Switch to preview mode"}
            aria-pressed={showPreview}
            className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {showPreview ? <Pencil className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>

          {mode === "active" && (
            <>
              <button
                onClick={onTogglePin}
                aria-label={note.pinned ? "Unpin note" : "Pin note"}
                aria-pressed={note.pinned}
                className={cn(
                  "h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  note.pinned ? "text-accent-500" : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                <Pin className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={onDuplicate}
                aria-label="Duplicate note"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Copy className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={onArchive}
                aria-label="Archive note"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Archive className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={onSoftDelete}
                aria-label="Move note to trash"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </>
          )}

          {mode === "archived" && (
            <>
              <button
                onClick={onUnarchive}
                aria-label="Restore from archive"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArchiveRestore className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={onSoftDelete}
                aria-label="Move note to trash"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </>
          )}

          {mode === "trash" && (
            <>
              <button
                onClick={onRestore}
                aria-label="Restore note"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={onPermanentDelete}
                aria-label="Delete note forever"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <XCircle className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Color picker */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-4 md:px-0 py-2.5 md:py-3" role="group" aria-label="Note color">
          {noteColors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              aria-label={`${noteColorConfig[color].label} color`}
              aria-pressed={note.color === color}
              className={cn(
                "h-6 w-6 rounded-full transition-transform",
                noteColorConfig[color].swatchClass,
                note.color === color && "ring-2 ring-offset-2 ring-accent-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      )}

      {/* Title + content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-[env(safe-area-inset-bottom)]">
        <input
          ref={titleRef}
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          disabled={readOnly}
          placeholder="Untitled note"
          aria-label="Note title"
          className="w-full text-2xl font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 py-2 disabled:opacity-70"
        />

        {showPreview ? (
          <div className="py-2">
            <MarkdownPreview content={localContent} onToggleCheckbox={readOnly ? undefined : handleToggleCheckbox} />
          </div>
        ) : (
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            disabled={readOnly}
            placeholder="Start writing... Markdown supported: **bold**, *italic*, # heading, - [ ] checklist"
            aria-label="Note content"
            className="w-full min-h-[40vh] md:min-h-[50vh] text-sm text-zinc-700 dark:text-zinc-300 bg-transparent outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 leading-relaxed disabled:opacity-70"
          />
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 md:px-0 py-3 border-t border-[var(--color-border)] text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
        <span>Created {new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        <span>Edited {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>
    </div>
  );
}
