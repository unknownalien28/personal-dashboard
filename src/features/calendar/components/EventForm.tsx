import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { eventColors, eventColorConfig } from "@/features/calendar/event-color-config";
import type { EventInput } from "@/features/calendar/calendar-store";
import type { CalendarEvent, EventColor, ReminderOption, RepeatOption } from "@/types/models";
import { toDateKey } from "@/features/calendar/date-utils";
import { useShake } from "@/hooks/useShake";
import { cn } from "@/lib/utils/cn";

const reminderLabels: Record<ReminderOption, string> = {
  none: "No reminder",
  atTime: "At event time",
  "5min": "5 minutes before",
  "15min": "15 minutes before",
  "30min": "30 minutes before",
  "1hour": "1 hour before",
  "1day": "1 day before",
};

const repeatLabels: Record<RepeatOption, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const repeatSegmentLabels: Record<RepeatOption, string> = {
  none: "None",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

interface EventFormProps {
  initial?: CalendarEvent;
  defaultDate?: Date;
  categories: string[];
  onSubmit: (values: EventInput) => void;
  onCancel: () => void;
}

export function EventForm({ initial, defaultDate, categories, onSubmit, onCancel }: EventFormProps) {
  const defaultDateKey = defaultDate ? toDateKey(defaultDate) : toDateKey(new Date());

  const [title, setTitle] = useState(initial?.title ?? "");
  const titleShake = useShake();
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaultDateKey);
  const [endDate, setEndDate] = useState(initial?.endDate ?? defaultDateKey);
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [color, setColor] = useState<EventColor>(initial?.color ?? "default");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Other");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [reminder, setReminder] = useState<ReminderOption>(initial?.reminder ?? "none");
  const [repeat, setRepeat] = useState<RepeatOption>(initial?.repeat ?? "none");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      titleShake.trigger();
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      allDay,
      color,
      category,
      location: location.trim(),
      reminder,
      repeat,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          onAnimationEnd={titleShake.onAnimationEnd}
          className={cn(
            "w-full h-11 rounded-lg border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400",
            titleShake.shaking ? "border-danger field-shake" : "border-[var(--color-border)]"
          )}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4 rounded accent-accent-500"
        />
        All-day event
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Start time</label>
            <input
              type="time"
              value={startTime ?? "09:00"}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">End time</label>
            <input
              type="time"
              value={endTime ?? "10:00"}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Color</label>
        <div className="flex items-center gap-2">
          {eventColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`${eventColorConfig[c].label} color`}
              aria-pressed={color === c}
              className={cn(
                "h-7 w-7 rounded-full transition-transform",
                eventColorConfig[c].swatchClass,
                color === c && "ring-2 ring-offset-2 ring-accent-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Optional"
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Reminder</label>
        <select
          value={reminder}
          onChange={(e) => setReminder(e.target.value as ReminderOption)}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        >
          {(Object.keys(reminderLabels) as ReminderOption[]).map((r) => (
            <option key={r} value={r}>
              {reminderLabels[r]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Repeat</label>
        <SegmentedControl
          value={repeat}
          onChange={setRepeat}
          options={(Object.keys(repeatLabels) as RepeatOption[]).map((r) => ({
            value: r,
            label: repeatSegmentLabels[r],
          }))}
          className="w-full flex-wrap"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
