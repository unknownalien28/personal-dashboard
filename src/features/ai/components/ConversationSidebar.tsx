import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Search, Plus, Pin, PinOff, Pencil, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import type { Conversation } from "@/types/models";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onTogglePin,
  onRename,
  onDelete,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = sortConversations(
    conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
  );

  function startRename(c: Conversation) {
    setRenamingId(c.id);
    setRenameValue(c.title);
  }

  function commitRename() {
    if (renamingId) onRename(renamingId, renameValue);
    setRenamingId(null);
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="p-3 flex flex-col gap-2.5 shrink-0">
        <Button variant="primary" onClick={onNewChat} className="w-full justify-center">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-6 px-2">
            {conversations.length === 0 ? "No conversations yet." : "No conversations match your search."}
          </p>
        )}

        {filtered.map((c) => (
          <div key={c.id} className="group relative">
            {renamingId === c.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenamingId(null);
                }}
                className="w-full h-11 rounded-lg border border-accent-400 bg-[var(--color-surface)] px-3 text-sm outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 h-11 text-left nav-glow",
                  activeId === c.id
                    ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400 nav-glow-active"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {c.pinned ? (
                  <Pin className="h-3.5 w-3.5 shrink-0 fill-current" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                )}
                <span className="flex-1 min-w-0 truncate text-sm">{c.title}</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 group-hover:hidden">
                  {formatDistanceToNowStrict(new Date(c.updatedAt), { addSuffix: false })}
                </span>

                <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(c.id);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title={c.pinned ? "Unpin" : "Pin"}
                  >
                    {c.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(c);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(c.id);
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded text-danger hover:bg-danger/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </span>
              </button>
            )}

            {confirmDeleteId === c.id && (
              <div className="absolute inset-0 z-10 flex items-center justify-between gap-2 rounded-lg bg-[var(--color-surface)] border border-danger/40 px-3 h-11 shadow-lg">
                <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">Delete this chat?</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-2 h-7 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(c.id);
                      setConfirmDeleteId(null);
                    }}
                    className="text-xs px-2 h-7 rounded-md bg-danger text-white hover:opacity-90"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
