import { memo } from "react";
import { Trash2, Star, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SwipeActions } from "@/components/ui/SwipeActions";
import { platformConfig } from "@/features/content/platforms";
import { statusConfig } from "@/features/content/status-config";
import { priorityConfig } from "@/features/tasks/priority-config";
import type { ContentPost } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface ContentCardProps {
  post: ContentPost;
  selected?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

const PRIORITY_BADGE_TONE = { low: "success", medium: "warning", high: "danger" } as const;

function ContentCardBase({ post, selected, onSelect, onToggleFavorite, onDelete }: ContentCardProps) {
  const platform = platformConfig[post.platform];
  const status = statusConfig[post.status];

  return (
    <SwipeActions
      trailingActions={[{ key: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" />, colorClass: "bg-danger", onAction: onDelete }]}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-xl border px-4 py-3 flex flex-col gap-2 card-glow hover-lift transition-colors",
          selected ? "border-accent-400 bg-accent-50/50 dark:bg-accent-500/10" : "border-[var(--color-border)] bg-[var(--color-surface)]"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <platform.icon className="h-4 w-4 shrink-0" style={{ color: platform.colorVar }} />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{post.title || "Untitled"}</span>
            {post.aiGenerated && <Sparkles className="h-3.5 w-3.5 text-accent-500 shrink-0" aria-label="AI-generated" />}
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn("shrink-0", post.favorite ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600 hover:text-amber-400")}
          >
            <Star className="h-4 w-4" fill={post.favorite ? "currentColor" : "none"} />
          </span>
        </div>

        {(post.description || post.body) && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{post.description || post.body}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={PRIORITY_BADGE_TONE[post.priority]}>{priorityConfig[post.priority].label}</Badge>
          {post.publishDate && <Badge tone="neutral">{post.publishDate}</Badge>}
          {post.category && <Badge tone="neutral">{post.category}</Badge>}
        </div>
      </button>
    </SwipeActions>
  );
}

export const ContentCard = memo(ContentCardBase);
