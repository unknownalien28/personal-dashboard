import { memo } from "react";
import { format, addMonths, subMonths, isSameDay, isSameMonth, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthGrid, toDateKey } from "@/features/calendar/date-utils";
import { cn } from "@/lib/utils/cn";

interface MiniCalendarProps {
  month: Date;
  selectedDate: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  eventDateKeys: Set<string>;
}

function MiniCalendarBase({ month, selectedDate, onMonthChange, onSelectDate, eventDateKeys }: MiniCalendarProps) {
  const weeks = getMonthGrid(month);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {format(month, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onMonthChange(subMonths(month, 1))}
            aria-label="Previous month"
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Next month"
            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 h-6 flex items-center justify-center">
            {d}
          </span>
        ))}
        {weeks.flat().map((day) => {
          const inMonth = isSameMonth(day, month);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const hasEvents = eventDateKeys.has(toDateKey(day));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              aria-label={format(day, "MMMM d, yyyy") + (today ? " (today)" : "")}
              aria-current={selected}
              className={cn(
                "h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs relative transition-colors duration-150",
                !inMonth && "text-zinc-300 dark:text-zinc-700",
                inMonth && !selected && "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                selected && "bg-accent-500 text-white font-semibold",
                today && !selected && "font-semibold text-accent-600 dark:text-accent-400"
              )}
            >
              {format(day, "d")}
              {hasEvents && !selected && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent-400" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const MiniCalendar = memo(MiniCalendarBase);
