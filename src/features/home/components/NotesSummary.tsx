import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Pin, StickyNote, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useNotesStore } from "@/features/notes/notes-store";

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotesSummary() {
  const notes = useNotesStore((s) => s.notes);

  const { total, pinnedCount, recents, latest } = useMemo(() => {
    const active = notes.filter((n) => !n.deletedAt);
    const sorted = [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      total: active.length,
      pinnedCount: active.filter((n) => n.pinned).length,
      recents: sorted.slice(0, 3),
      latest: sorted[0] ?? null,
    };
  }, [notes]);

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{total} total</span>
          <span className="flex items-center gap-1">
            <Pin className="h-3 w-3" /> {pinnedCount} pinned
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {latest && (
          <Link
            to="/notes"
            state={{ noteId: latest.id }}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:border-accent-400 transition-colors duration-150 group"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-accent-600 dark:text-accent-400 mb-0.5">
                Continue writing
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {latest.title || "Untitled note"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-accent-500 shrink-0 transition-colors duration-150" />
          </Link>
        )}

        {recents.length > 1 && (
          <ul role="list" className="flex flex-col gap-1.5">
            {recents.slice(1).map((note) => (
              <li key={note.id}>
                <Link
                  to="/notes"
                  state={{ noteId: note.id }}
                  className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-150"
                >
                  <StickyNote className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{note.title || "Untitled note"}</span>
                  <span className="shrink-0">{relativeTime(note.updatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
