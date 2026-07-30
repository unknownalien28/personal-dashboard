import type { DashboardCard } from "@/features/ai/dashboard-cards";

const TONE_ACCENT: Record<DashboardCard["tone"], string> = {
  info: "text-accent-500",
  warning: "text-amber-500",
  success: "text-emerald-500",
};

interface DashboardCardsProps {
  cards: DashboardCard[];
  onCardClick: (card: DashboardCard) => void;
}

export function DashboardCards({ cards, onCardClick }: DashboardCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onCardClick(card)}
          className="flex flex-col gap-1.5 text-left rounded-xl border border-[var(--color-border)] glass-panel px-4 py-3 card-glow hover-lift transition-colors"
        >
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 shrink-0 ${TONE_ACCENT[card.tone]}`} />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{card.title}</span>
          </div>
          <div className="flex flex-col gap-0.5 pl-6">
            {card.lines.map((line, i) => (
              <span key={i} className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {line}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
