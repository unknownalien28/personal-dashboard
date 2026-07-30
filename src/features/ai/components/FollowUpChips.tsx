import { useNavigate } from "react-router-dom";
import type { ChatMessage } from "@/types/models";
import { suggestFollowUps } from "@/features/ai/follow-ups";

interface FollowUpChipsProps {
  message: ChatMessage;
  onAsk: (prompt: string, module?: string) => void;
}

export function FollowUpChips({ message, onAsk }: FollowUpChipsProps) {
  const navigate = useNavigate();
  const suggestions = suggestFollowUps(message);
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1 pl-11">
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => (s.to ? navigate(s.to) : onAsk(s.prompt, s.module))}
          className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
