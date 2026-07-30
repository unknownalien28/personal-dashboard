import { Sparkles, Hash, Wand2, Copy, Repeat, ListChecks, MousePointerClick } from "lucide-react";
import { askAlien } from "@/features/ai/ask-alien";
import { useContentStore } from "@/features/content/content-store";
import { platformConfig } from "@/features/content/platforms";
import type { ContentPost } from "@/types/models";

interface AIQuickActionsProps {
  post: Pick<ContentPost, "id" | "title" | "body" | "platform">;
  onApplyBody?: (text: string) => void;
}

/**
 * Phase 8 AI Quick Actions. Every action opens the floating assistant with a
 * prompt referencing this exact post, and marks it as the "active editing"
 * document first so the context engine attaches its full body - not just a
 * one-line summary - without the user manually switching context.
 */
export function AIQuickActions({ post }: AIQuickActionsProps) {
  const setActiveEditingId = useContentStore((s) => s.setActiveEditingId);
  const platformLabel = platformConfig[post.platform].label;

  function ask(prompt: string) {
    setActiveEditingId(post.id);
    askAlien(prompt, ["content"]);
  }

  const actions = [
    { label: "Generate Caption", icon: Sparkles, prompt: `Write a caption for "${post.title}" on ${platformLabel}.` },
    { label: "Generate Hashtags", icon: Hash, prompt: `Suggest relevant hashtags for "${post.title}" on ${platformLabel}.` },
    { label: "Improve Writing", icon: Wand2, prompt: `Improve the writing and tone of this content: "${post.title}".` },
    { label: "Create Variations", icon: Copy, prompt: `Give me 3 variations of this content: "${post.title}".` },
    { label: "Repurpose Content", icon: Repeat, prompt: `Repurpose "${post.title}" for a different platform.` },
    { label: "Create Poll", icon: ListChecks, prompt: `Turn "${post.title}" into a poll with 3-4 options.` },
    { label: "Generate CTA", icon: MousePointerClick, prompt: `Suggest a strong call-to-action for "${post.title}".` },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-[var(--color-border)] bg-accent-50/40 dark:bg-accent-500/5 p-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => ask(a.prompt)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <a.icon className="h-3.5 w-3.5 text-accent-500" /> {a.label}
        </button>
      ))}
    </div>
  );
}
