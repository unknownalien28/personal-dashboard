import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";

export const DATE_FMT = "yyyy-MM-dd";

export function toDateKey(date: Date): string {
  return format(date, DATE_FMT);
}

export function parseEventDateTime(dateKey: string, time: string | null): Date {
  const base = parseISO(dateKey);
  if (!time) return base;
  const [h, m] = time.split(":").map(Number);
  const withTime = new Date(base);
  withTime.setHours(h, m, 0, 0);
  return withTime;
}

/** Returns a 6x7 (or fewer trailing rows trimmed) grid of days covering the given month, starting on Sunday. */
export function getMonthGrid(reference: Date): Date[][] {
  const start = startOfWeek(startOfMonth(reference));
  const end = endOfWeek(endOfMonth(reference));
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function getWeekDays(reference: Date): Date[] {
  const start = startOfWeek(reference);
  const end = endOfWeek(reference);
  return eachDayOfInterval({ start, end });
}

export const HOURS_IN_DAY = Array.from({ length: 24 }, (_, i) => i);

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function timeToMinutes(time: string | null): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
