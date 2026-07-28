import { ChevronLeft, ChevronRight } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";

export type CalendarView = "month" | "week" | "day" | "agenda";

interface CalendarToolbarProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarToolbar({ view, onViewChange, periodLabel, onPrev, onNext, onToday }: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrev}
            aria-label="Previous period"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            aria-label="Next period"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {periodLabel}
        </h2>
      </div>

      <SegmentedControl
        value={view}
        onChange={onViewChange}
        options={[
          { value: "month", label: "Month" },
          { value: "week", label: "Week" },
          { value: "day", label: "Day" },
          { value: "agenda", label: "Agenda" },
        ]}
      />
    </div>
  );
}
