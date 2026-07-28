import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from "date-fns";
import type { CalendarEvent, RepeatOption } from "@/types/models";
import { parseEventDateTime } from "@/features/calendar/date-utils";

export interface Occurrence {
  event: CalendarEvent;
  occurrenceStart: Date;
  occurrenceEnd: Date;
  isRecurrenceInstance: boolean;
}

function stepForward(date: Date, repeat: RepeatOption): Date {
  switch (repeat) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "yearly":
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

/**
 * Jumps the cursor close to rangeStart before iterating, so a daily/weekly repeat
 * that began years ago doesn't need thousands of steps to reach the visible range.
 * Backs off by one step to avoid skipping an occurrence that starts just before
 * rangeStart but whose duration extends into it.
 */
function fastForward(baseStart: Date, rangeStart: Date, repeat: RepeatOption): Date {
  if (!isBefore(baseStart, rangeStart)) return baseStart;

  let stepsToSkip = 0;
  switch (repeat) {
    case "daily":
      stepsToSkip = differenceInCalendarDays(rangeStart, baseStart);
      break;
    case "weekly":
      stepsToSkip = differenceInCalendarWeeks(rangeStart, baseStart);
      break;
    case "monthly":
      stepsToSkip = differenceInCalendarMonths(rangeStart, baseStart);
      break;
    case "yearly":
      stepsToSkip = differenceInCalendarYears(rangeStart, baseStart);
      break;
  }
  stepsToSkip = Math.max(0, stepsToSkip - 1);

  let cursor = baseStart;
  for (let i = 0; i < stepsToSkip; i++) cursor = stepForward(cursor, repeat);
  return cursor;
}

function overlapsRange(start: Date, end: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return !isAfter(start, rangeEnd) && !isBefore(end, rangeStart);
}

const MAX_ITERATIONS_AFTER_FASTFORWARD = 400;

/** Expands events (including repeat rules) into concrete occurrences overlapping [rangeStart, rangeEnd]. */
export function expandOccurrences(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): Occurrence[] {
  const result: Occurrence[] = [];

  for (const event of events) {
    const baseStart = parseEventDateTime(event.startDate, event.allDay ? null : event.startTime);
    const baseEndRaw = parseEventDateTime(
      event.endDate,
      event.allDay ? null : event.endTime ?? event.startTime
    );
    // All-day events should occupy the full end date, not just midnight.
    const baseEnd = event.allDay
      ? new Date(baseEndRaw.getFullYear(), baseEndRaw.getMonth(), baseEndRaw.getDate(), 23, 59, 59)
      : baseEndRaw;
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());

    if (event.repeat === "none") {
      if (overlapsRange(baseStart, baseEnd, rangeStart, rangeEnd)) {
        result.push({ event, occurrenceStart: baseStart, occurrenceEnd: baseEnd, isRecurrenceInstance: false });
      }
      continue;
    }

    let cursorStart = fastForward(baseStart, rangeStart, event.repeat);
    let iterations = 0;
    while (!isAfter(cursorStart, rangeEnd) && iterations < MAX_ITERATIONS_AFTER_FASTFORWARD) {
      const cursorEnd = new Date(cursorStart.getTime() + durationMs);
      if (overlapsRange(cursorStart, cursorEnd, rangeStart, rangeEnd)) {
        result.push({
          event,
          occurrenceStart: cursorStart,
          occurrenceEnd: cursorEnd,
          isRecurrenceInstance: cursorStart.getTime() !== baseStart.getTime(),
        });
      }
      cursorStart = stepForward(cursorStart, event.repeat);
      iterations++;
    }
  }

  return result.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime());
}
