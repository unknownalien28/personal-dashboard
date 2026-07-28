import { memo } from "react";
import { format, isSameMonth, isSameDay, isToday, startOfDay, endOfDay } from "date-fns";
import { getMonthGrid, toDateKey } from "@/features/calendar/date-utils";
import { EventChip } from "@/features/calendar/components/EventChip";
import type { Occurrence } from "@/features/calendar/occurrences";
import { cn } from "@/lib/utils/cn";

const MAX_VISIBLE_PER_DAY = 3;

interface MonthViewProps {
  month: Date;
  selectedDate: Date;
  occurrences: Occurrence[];
  onSelectDate: (date: Date) => void;
  onOpenEvent: (eventId: string) => void;
  activeDragId: string | null;
  dragOverDate: string | null;
  onEventPointerDown: (eventId: string, e: React.PointerEvent) => void;
  onEventPointerMove: (e: React.PointerEvent) => void;
  onEventPointerUp: (e: React.PointerEvent) => void;
  consumeWasDragged: () => boolean;
}

function occursOnDay(occ: Occurrence, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  return occ.occurrenceStart.getTime() <= dayEnd && occ.occurrenceEnd.getTime() >= dayStart;
}

function MonthViewBase({
  month,
  selectedDate,
  occurrences,
  onSelectDate,
  onOpenEvent,
  activeDragId,
  dragOverDate,
  onEventPointerDown,
  onEventPointerMove,
  onEventPointerUp,
  consumeWasDragged,
}: MonthViewProps) {
  const weeks = getMonthGrid(month);

  return (
    <div className="flex flex-col border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1">
        {weeks.flat().map((day) => {
          const dateKey = toDateKey(day);
          const dayOccurrences = occurrences.filter((occ) => occursOnDay(occ, day));
          const visible = dayOccurrences.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayOccurrences.length - visible.length;
          const inMonth = isSameMonth(day, month);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const isDropTarget = dragOverDate === dateKey;

          return (
            <div
              key={dateKey}
              data-date={dateKey}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(day);
                }
              }}
              aria-label={format(day, "MMMM d, yyyy")}
              aria-current={selected}
              className={cn(
                "min-h-[88px] md:min-h-[104px] border-b border-r border-[var(--color-border)] p-1.5 text-left flex flex-col gap-1 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400",
                !inMonth && "bg-zinc-50/60 dark:bg-zinc-900/40",
                selected && "ring-2 ring-inset ring-accent-400",
                isDropTarget && "bg-accent-50 dark:bg-accent-500/10"
              )}
            >
              <span
                className={cn(
                  "h-6 w-6 flex items-center justify-center rounded-full text-xs shrink-0",
                  !inMonth && "text-zinc-300 dark:text-zinc-700",
                  inMonth && !today && "text-zinc-700 dark:text-zinc-300",
                  today && "bg-accent-500 text-white font-semibold"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="flex flex-col gap-0.5">
                {visible.map((occ) => (
                  <EventChip
                    key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}
                    occurrence={occ}
                    dense
                    draggable
                    isDragging={activeDragId === occ.event.id}
                    onPointerDown={(e) => onEventPointerDown(occ.event.id, e)}
                    onPointerMove={onEventPointerMove}
                    onPointerUp={onEventPointerUp}
                    onClick={() => {
                      if (consumeWasDragged()) return;
                      onOpenEvent(occ.event.id);
                    }}
                  />
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1.5">
                    +{overflow} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const MonthView = memo(MonthViewBase);
