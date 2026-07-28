import { memo } from "react";
import { format, isSameDay, isToday, startOfDay, endOfDay } from "date-fns";
import { HOURS_IN_DAY, formatHourLabel, toDateKey } from "@/features/calendar/date-utils";
import { layoutOccurrences } from "@/features/calendar/layout";
import { eventColorConfig } from "@/features/calendar/event-color-config";
import type { Occurrence } from "@/features/calendar/occurrences";
import { cn } from "@/lib/utils/cn";

const ROW_HEIGHT = 48; // px per hour

interface TimeGridViewProps {
  days: Date[];
  occurrences: Occurrence[];
  onOpenEvent: (eventId: string) => void;
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function TimeGridViewBase({ days, occurrences, onOpenEvent, onSelectDate, selectedDate }: TimeGridViewProps) {
  const now = new Date();

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col">
      {/* Day headers */}
      <div className="grid border-b border-[var(--color-border)] bg-[var(--color-surface)]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((day) => (
          <button
            key={toDateKey(day)}
            onClick={() => onSelectDate?.(day)}
            className={cn(
              "py-2 text-center border-l border-[var(--color-border)]",
              selectedDate && isSameDay(day, selectedDate) && "bg-accent-50 dark:bg-accent-500/10"
            )}
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{format(day, "EEE")}</div>
            <div
              className={cn(
                "text-sm font-semibold mx-auto mt-0.5 h-6 w-6 flex items-center justify-center rounded-full",
                isToday(day) ? "bg-accent-500 text-white" : "text-zinc-900 dark:text-zinc-100"
              )}
            >
              {format(day, "d")}
            </div>
          </button>
        ))}
      </div>

      {/* All-day strip */}
      <div
        className="grid border-b border-[var(--color-border)]"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-end pr-1.5 py-1">
          All day
        </div>
        {days.map((day) => {
          const allDayOccs = occurrences.filter(
            (occ) =>
              occ.event.allDay &&
              occ.occurrenceStart.getTime() <= endOfDay(day).getTime() &&
              occ.occurrenceEnd.getTime() >= startOfDay(day).getTime()
          );
          return (
            <div key={toDateKey(day)} className="border-l border-[var(--color-border)] p-1 flex flex-col gap-0.5 min-h-[32px]">
              {allDayOccs.map((occ) => (
                <button
                  key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}
                  onClick={() => onOpenEvent(occ.event.id)}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] font-medium truncate text-left",
                    eventColorConfig[occ.event.color].chipClass
                  )}
                >
                  {occ.event.title || "Untitled event"}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Scrollable hour grid */}
      <div className="overflow-y-auto max-h-[60vh]">
        <div className="grid relative" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          {/* Hour labels column */}
          <div>
            {HOURS_IN_DAY.map((hour) => (
              <div key={hour} style={{ height: ROW_HEIGHT }} className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right pr-1.5 -translate-y-2">
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayStart = startOfDay(day).getTime();
            const dayEnd = endOfDay(day).getTime();
            const dayOccs = occurrences.filter(
              (occ) =>
                !occ.event.allDay &&
                occ.occurrenceStart.getTime() <= dayEnd &&
                occ.occurrenceEnd.getTime() >= dayStart
            );
            const positioned = layoutOccurrences(dayOccs);
            const showNowLine = isToday(day);

            return (
              <div key={toDateKey(day)} className="relative border-l border-[var(--color-border)]">
                {HOURS_IN_DAY.map((hour) => (
                  <div key={hour} style={{ height: ROW_HEIGHT }} className="border-b border-[var(--color-border)]" />
                ))}

                {showNowLine && (
                  <div
                    className="absolute left-0 right-0 h-px bg-danger z-10"
                    style={{ top: (minutesSinceMidnight(now) / 60) * ROW_HEIGHT }}
                    aria-hidden="true"
                  />
                )}

                {positioned.map((occ) => {
                  const clipStart = Math.max(occ.occurrenceStart.getTime(), dayStart);
                  const clipEnd = Math.min(occ.occurrenceEnd.getTime(), dayEnd);
                  const startMin = minutesSinceMidnight(new Date(clipStart));
                  const durationMin = Math.max(20, (clipEnd - clipStart) / 60000);
                  const widthPct = 100 / occ.totalColumns;
                  const leftPct = occ.column * widthPct;

                  return (
                    <button
                      key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}
                      onClick={() => onOpenEvent(occ.event.id)}
                      className={cn(
                        "absolute rounded px-1.5 py-0.5 text-[11px] font-medium text-left overflow-hidden",
                        eventColorConfig[occ.event.color].chipClass
                      )}
                      style={{
                        top: (startMin / 60) * ROW_HEIGHT,
                        height: (durationMin / 60) * ROW_HEIGHT,
                        left: `${leftPct}%`,
                        width: `calc(${widthPct}% - 2px)`,
                      }}
                    >
                      <span className="block truncate">{occ.event.title || "Untitled event"}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const TimeGridView = memo(TimeGridViewBase);
