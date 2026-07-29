import { memo } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarX } from "lucide-react";
import { EventChip } from "@/features/calendar/components/EventChip";
import type { Occurrence } from "@/features/calendar/occurrences";

interface AgendaViewProps {
  occurrences: Occurrence[];
  onOpenEvent: (eventId: string) => void;
  emptyMessage?: string;
}

function AgendaViewBase({ occurrences, onOpenEvent, emptyMessage }: AgendaViewProps) {
  if (occurrences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 gap-3 empty-state-in">
        <div className="h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
          <CalendarX className="h-6 w-6 text-accent-500" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          {emptyMessage ?? "No events match this view."}
        </p>
      </div>
    );
  }

  const groups: { day: Date; items: Occurrence[] }[] = [];
  for (const occ of occurrences) {
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, occ.occurrenceStart)) {
      last.items.push(occ);
    } else {
      groups.push({ day: occ.occurrenceStart, items: [occ] });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.day.toISOString()}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2">
            {format(group.day, "EEEE, MMMM d")}
          </h3>
          <ul role="list" className="flex flex-col gap-1.5">
            {group.items.map((occ) => (
              <li key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}>
                <EventChip occurrence={occ} onClick={() => onOpenEvent(occ.event.id)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export const AgendaView = memo(AgendaViewBase);
