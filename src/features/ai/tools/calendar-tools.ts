import { addDays, startOfDay, endOfDay } from "date-fns";
import { useCalendarStore, type EventInput } from "@/features/calendar/calendar-store";
import { expandOccurrences, type Occurrence } from "@/features/calendar/occurrences";
import { ok, fail, type ToolResult } from "./types";
import type { CalendarEvent } from "@/types/models";

function activeEvents(): CalendarEvent[] {
  return useCalendarStore.getState().events.filter((e) => !e.archived);
}

function findByTitle(query: string): CalendarEvent | undefined {
  const q = query.trim().toLowerCase();
  return activeEvents().find((e) => e.title.toLowerCase().includes(q));
}

/** Expands recurring events into concrete occurrences within [start, end]. */
export function getEvents(start: Date, end: Date): ToolResult<Occurrence[]> {
  const occurrences = expandOccurrences(activeEvents(), start, end);
  return ok(`Found ${occurrences.length} event occurrence(s).`, occurrences);
}

export function getEventsForToday(): ToolResult<Occurrence[]> {
  return getEvents(startOfDay(new Date()), endOfDay(new Date()));
}

export function getEventsForTomorrow(): ToolResult<Occurrence[]> {
  const tomorrow = addDays(new Date(), 1);
  return getEvents(startOfDay(tomorrow), endOfDay(tomorrow));
}

export function createEvent(input: EventInput): ToolResult<{ id: string }> {
  if (!input.title?.trim()) return fail("An event needs a title.");
  const id = useCalendarStore.getState().createEvent(input);
  return ok(`Created event "${input.title}" on ${input.startDate}.`, { id });
}

export function updateEvent(idOrTitle: string, updates: Partial<EventInput>): ToolResult<{ id: string }> {
  const event = activeEvents().find((e) => e.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!event) return fail(`Couldn't find an event matching "${idOrTitle}".`);
  useCalendarStore.getState().updateEvent(event.id, updates);
  return ok(`Updated "${event.title}".`, { id: event.id });
}

export function deleteEvent(idOrTitle: string): ToolResult<{ id: string }> {
  const event = activeEvents().find((e) => e.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!event) return fail(`Couldn't find an event matching "${idOrTitle}".`);
  useCalendarStore.getState().deleteEvent(event.id);
  return ok(`Deleted "${event.title}".`, { id: event.id });
}

/** Same-day, time-overlapping occurrences - flagged so the assistant can warn before double-booking. */
export function detectConflicts(start: Date, end: Date): ToolResult<[Occurrence, Occurrence][]> {
  const occurrences = expandOccurrences(activeEvents(), start, end).filter((o) => !o.event.allDay);
  const conflicts: [Occurrence, Occurrence][] = [];
  for (let i = 0; i < occurrences.length; i++) {
    for (let j = i + 1; j < occurrences.length; j++) {
      const a = occurrences[i];
      const b = occurrences[j];
      if (a.occurrenceStart < b.occurrenceEnd && b.occurrenceStart < a.occurrenceEnd) {
        conflicts.push([a, b]);
      }
    }
  }
  return ok(`${conflicts.length} scheduling conflict(s) found.`, conflicts);
}

function minutesToLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Free 30-min+ gaps between 8am-8pm on the given day, used for "find free time" / "schedule a meeting". */
export function findFreeTime(day: Date, minMinutes = 30): ToolResult<{ start: string; end: string }[]> {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const busy = expandOccurrences(activeEvents(), dayStart, dayEnd)
    .filter((o) => !o.event.allDay)
    .sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime());

  const windowStartMin = 8 * 60;
  const windowEndMin = 20 * 60;
  const busyRanges = busy.map((o) => ({
    start: Math.max(windowStartMin, o.occurrenceStart.getHours() * 60 + o.occurrenceStart.getMinutes()),
    end: Math.min(windowEndMin, o.occurrenceEnd.getHours() * 60 + o.occurrenceEnd.getMinutes()),
  }));

  const free: { start: string; end: string }[] = [];
  let cursor = windowStartMin;
  for (const range of busyRanges) {
    if (range.start - cursor >= minMinutes) {
      free.push({ start: minutesToLabel(cursor), end: minutesToLabel(range.start) });
    }
    cursor = Math.max(cursor, range.end);
  }
  if (windowEndMin - cursor >= minMinutes) {
    free.push({ start: minutesToLabel(cursor), end: minutesToLabel(windowEndMin) });
  }
  return ok(`${free.length} free slot(s) of ${minMinutes}+ minutes found.`, free);
}
