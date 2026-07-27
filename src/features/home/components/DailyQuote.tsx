import { Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getTodaysQuote } from "@/features/home/quotes";

export function DailyQuote() {
  const quote = getTodaysQuote();

  return (
    <Card className="p-5 relative overflow-hidden">
      <Quote className="h-8 w-8 text-accent-100 dark:text-accent-500/20 absolute top-3 right-4" />
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed relative">
        "{quote.text}"
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 relative">— {quote.author}</p>
    </Card>
  );
}
