import { useState } from "react";
import { Sparkles, Plus, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { askAlien } from "@/features/ai/ask-alien";
import { ContentCard } from "./ContentCard";
import type { ContentPost } from "@/types/models";

interface ContentIdeasViewProps {
  ideas: ContentPost[];
  onQuickCreate: (title: string) => void;
  onOpenPost: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ContentIdeasView({ ideas, onQuickCreate, onOpenPost, onToggleFavorite, onDelete }: ContentIdeasViewProps) {
  const [quickTitle, setQuickTitle] = useState("");

  function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickCreate(quickTitle.trim());
    setQuickTitle("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleQuickCreate} className="flex-1 flex gap-2">
          <input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Capture a quick idea…"
            className="flex-1 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
          <Button type="submit" variant="secondary">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
        <Button
          variant="primary"
          onClick={() => askAlien("Brainstorm 5 content ideas for me based on what I usually post about.", ["content"])}
        >
          <Sparkles className="h-4 w-4" /> Generate Ideas with AI
        </Button>
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Capture a quick idea above, or let Alien Assistant brainstorm a few for you."
          compact
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ideas.map((idea) => (
            <ContentCard
              key={idea.id}
              post={idea}
              onSelect={() => onOpenPost(idea.id)}
              onToggleFavorite={() => onToggleFavorite(idea.id)}
              onDelete={() => onDelete(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
