import { memo } from "react";
import { Pin, Archive, ArchiveRestore, Trash2, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SwipeActions, type SwipeAction } from "@/components/ui/SwipeActions";
import { noteColorConfig } from "@/features/notes/color-config";
import { stripMarkdown } from "@/features/notes/markdown";
import type { Note } from "@/types/models";
import { cn } from "@/lib/utils/cn";

export type NoteCardMode = "active" | "archived" | "trash";

interface NoteCardProps {
  note: Note;
  selected: boolean;
  mode: NoteCardMode;
  onSelect: () => void;
  onTogglePin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onSoftDelete?: () => void;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NoteCardBase({
  note,
  selected,
  mode,
  onSelect,
  onTogglePin,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onPermanentDelete,
}: NoteCardProps) {
  const preview = stripMarkdown(note.content);
  const color = noteColorConfig[note.color];

  const leadingActions: SwipeAction[] = [];
  const trailingActions: SwipeAction[] = [];

  if (mode === "active") {
    if (onTogglePin) {
      leadingActions.push({
        key: "pin",
        label: note.pinned ? "Unpin" : "Pin",
        icon: <Pin className="h-4 w-4" />,
        colorClass: "bg-accent-500",
        onAction: onTogglePin,
      });
    }
    if (onArchive) {
      trailingActions.push({
        key: "archive",
        label: "Archive",
        icon: <Archive className="h-4 w-4" />,
        colorClass: "bg-zinc-500",
        onAction: onArchive,
      });
    }
    if (onSoftDelete) {
      trailingActions.push({
        key: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        colorClass: "bg-danger",
        onAction: onSoftDelete,
      });
    }
  } else if (mode === "archived") {
    if (onUnarchive) {
      leadingActions.push({
        key: "restore",
        label: "Restore",
        icon: <ArchiveRestore className="h-4 w-4" />,
        colorClass: "bg-accent-500",
        onAction: onUnarchive,
      });
    }
    if (onSoftDelete) {
      trailingActions.push({
        key: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        colorClass: "bg-danger",
        onAction: onSoftDelete,
      });
    }
  } else {
    if (onRestore) {
      leadingActions.push({
        key: "restore",
        label: "Restore",
        icon: <RotateCcw className="h-4 w-4" />,
        colorClass: "bg-accent-500",
        onAction: onRestore,
      });
    }
    if (onPermanentDelete) {
      trailingActions.push({
        key: "delete-forever",
        label: "Delete forever",
        icon: <XCircle className="h-4 w-4" />,
        colorClass: "bg-danger",
        onAction: onPermanentDelete,
      });
    }
  }

  return (
    <SwipeActions leadingActions={leadingActions} trailingActions={trailingActions}>
      <button
        onClick={onSelect}
        aria-current={selected}
        className={cn(
          "w-full text-left rounded-xl border p-3.5 flex gap-3 transition-colors duration-150",
          selected
            ? "border-accent-400 bg-accent-50 dark:bg-accent-500/10"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-zinc-300 dark:hover:border-zinc-600"
        )}
      >
        <span className={cn("w-1 shrink-0 rounded-full", color.accentClass)} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {note.pinned && <Pin className="h-3.5 w-3.5 text-accent-500 shrink-0" aria-label="Pinned" />}
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {note.title || "Untitled note"}
            </span>
          </span>
          {preview && (
            <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
              {preview}
            </span>
          )}
          <span className="flex items-center gap-2 mt-1.5">
            <Badge tone="neutral">{relativeTime(note.updatedAt)}</Badge>
          </span>
        </span>
      </button>
    </SwipeActions>
  );
}

export const NoteCard = memo(NoteCardBase);
