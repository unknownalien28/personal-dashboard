import { useEffect, useRef } from "react";
import type { CalendarEvent, ReminderOption } from "@/types/models";
import { expandOccurrences } from "@/features/calendar/occurrences";

export function reminderOffsetMinutes(reminder: ReminderOption): number | null {
  switch (reminder) {
    case "atTime":
      return 0;
    case "5min":
      return 5;
    case "15min":
      return 15;
    case "30min":
      return 30;
    case "1hour":
      return 60;
    case "1day":
      return 60 * 24;
    default:
      return null;
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return Promise.resolve("denied");
  return Notification.requestPermission();
}

const SCHEDULING_HORIZON_MS = 24 * 60 * 60 * 1000; // only schedule what fires within the next 24h

/**
 * Schedules foreground browser notifications for upcoming reminders.
 * Uses occurrence expansion so recurring events get a reminder for their next
 * actual occurrence, not just their original start date.
 *
 * Note: this only fires while the app tab is open — there's no backend here to
 * schedule true background push notifications.
 */
export function useReminderScheduler(events: CalendarEvent[]) {
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];

    if (getNotificationPermission() !== "granted") return;

    const now = new Date();
    const horizon = new Date(now.getTime() + SCHEDULING_HORIZON_MS);
    const remindable = events.filter((e) => !e.archived && e.reminder !== "none");
    const occurrences = expandOccurrences(remindable, now, horizon);

    for (const { event, occurrenceStart } of occurrences) {
      const offsetMin = reminderOffsetMinutes(event.reminder);
      if (offsetMin === null) continue;
      const fireAt = occurrenceStart.getTime() - offsetMin * 60000;
      if (fireAt <= now.getTime()) continue;

      const delay = fireAt - now.getTime();
      const timerId = window.setTimeout(() => {
        new Notification(event.title || "Upcoming event", {
          body:
            offsetMin === 0
              ? "Starting now"
              : `Starting in ${offsetMin >= 60 ? `${Math.round(offsetMin / 60)}h` : `${offsetMin}m`}`,
          tag: `${event.id}-${occurrenceStart.getTime()}`,
        });
      }, delay);
      timers.current.push(timerId);
    }

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [events]);
}
