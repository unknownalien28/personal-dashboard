import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addMonths, subMonths, format } from "date-fns";
import { CalendarClock, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useCalendarStore } from "@/features/calendar/calendar-store";
import { expandOccurrences } from "@/features/calendar/occurrences";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Starting now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function CalendarSummary() {
  const events = useCalendarStore((s) => s.events);
  const [now, setNow] = useState(new Date());

  // Live countdown - refresh once a minute, enough resolution for a "next event in" display.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const { todayCount, thisWeekCount, upcoming, next } = useMemo(() => {
    const nonArchived = events.filter((e) => !e.archived);
    const rangeStart = subMonths(now, 1);
    const rangeEnd = addMonths(now, 2);
    const occurrences = expandOccurrences(nonArchived, rangeStart, rangeEnd).sort(
      (a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime()
    );

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const future = occurrences.filter((occ) => occ.occurrenceEnd.getTime() >= now.getTime());

    return {
      todayCount: occurrences.filter((occ) => occ.occurrenceStart <= todayEnd && occ.occurrenceEnd >= todayStart).length,
      thisWeekCount: occurrences.filter((occ) => occ.occurrenceStart <= weekEnd && occ.occurrenceEnd >= weekStart).length,
      upcoming: future.slice(0, 3),
      next: future[0] ?? null,
    };
  }, [events, now]);

  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{todayCount} today</span>
          <span>{thisWeekCount} this week</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {next && (
          <Link
            to="/calendar"
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3 hover:border-accent-400 transition-colors duration-150 group"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-accent-600 dark:text-accent-400 mb-0.5">
                Next event in {formatCountdown(next.occurrenceStart.getTime() - now.getTime())}
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {next.event.title || "Untitled event"}
              </p>
              {next.event.location && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" /> {next.event.location}
                </p>
              )}
            </div>
            <CalendarClock className="h-5 w-5 text-zinc-400 group-hover:text-accent-500 shrink-0 transition-colors duration-150" />
          </Link>
        )}

        {upcoming.length > 1 && (
          <ul role="list" className="flex flex-col gap-1.5">
            {upcoming.slice(1).map((occ) => (
              <li key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}>
                <Link
                  to="/calendar"
                  className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-150"
                >
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{occ.event.title || "Untitled event"}</span>
                  <span className="shrink-0">{format(occ.occurrenceStart, "MMM d, h:mm a")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
