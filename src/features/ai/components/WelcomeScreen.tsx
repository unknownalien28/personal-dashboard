import { useMemo } from "react";
import { Bot, ListChecks, NotebookPen, Lightbulb, TrendingUp } from "lucide-react";
import { generateBriefing } from "@/features/ai/briefing";
import { generateDashboardCards, type DashboardCard } from "@/features/ai/dashboard-cards";
import { DashboardCards } from "./DashboardCards";

const SUGGESTIONS = [
  { icon: ListChecks, text: "What should I work on first?" },
  { icon: NotebookPen, text: "Summarize my notes" },
  { icon: Lightbulb, text: "What goals am I behind on?" },
  { icon: TrendingUp, text: "How much did I spend this month?" },
];

interface WelcomeScreenProps {
  onSuggestionClick: (text: string, module?: string) => void;
}

/**
 * The AI Dashboard (Phase 6, Part 2): instead of a blank welcome page, this
 * opens with a personalized briefing and a grid of proactive insight cards
 * (Part 3) - everything computed locally from generateBriefing/
 * generateDashboardCards, no AI provider call required to render it.
 */
export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const briefing = useMemo(() => generateBriefing(), []);
  const cards = useMemo(() => generateDashboardCards(), []);

  function handleCardClick(card: DashboardCard) {
    onSuggestionClick(card.prompt, card.module);
  }

  return (
    <div className="flex-1 flex flex-col items-center text-center px-6 empty-state-in overflow-y-auto py-8">
      <div className="empty-icon-glow h-14 w-14 rounded-2xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center mb-4">
        <Bot className="h-7 w-7 text-accent-500" />
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{briefing.headline}.</h1>

      {briefing.lines.length > 0 ? (
        <div className="flex flex-col gap-1 mt-2 max-w-sm">
          {briefing.lines.map((line, i) => (
            <p key={i} className="text-sm text-zinc-500 dark:text-zinc-400">
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5">
          Your AI companion inside AlienOS. Ask a question, brainstorm an idea, or just say hello.
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <DashboardCards cards={cards} onCardClick={handleCardClick} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSuggestionClick(s.text)}
            className="flex items-center gap-2.5 text-left rounded-xl border border-[var(--color-border)] glass-panel px-3.5 py-3 card-glow hover-lift transition-colors"
          >
            <s.icon className="h-4 w-4 text-accent-500 shrink-0" />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
