import { memo } from "react";
import { format } from "date-fns";
import { Repeat } from "lucide-react";
import { eventColorConfig } from "@/features/calendar/event-color-config";
import type { Occurrence } from "@/features/calendar/occurrences";
import { cn } from "@/lib/utils/cn";

interface EventChipProps {
  occurrence: Occurrence;
  onClick: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  draggable?: boolean;
  isDragging?: boolean;
  dense?: boolean;
}

function EventChipBase({
  occurrence,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  draggable,
  isDragging,
  dense,
}: EventChipProps) {
  const { event, occurrenceStart } = occurrence;
  const color = eventColorConfig[event.color];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={draggable ? onPointerDown : undefined}
      onPointerMove={draggable ? onPointerMove : undefined}
      onPointerUp={draggable ? onPointerUp : undefined}
      style={draggable ? { touchAction: "none" } : undefined}
      aria-label={`${event.title || "Untitled event"}${event.allDay ? ", all day" : `, ${format(occurrenceStart, "h:mm a")}`}`}
      className={cn(
        "w-full text-left rounded-md px-1.5 py-0.5 text-[11px] font-medium truncate flex items-center gap-1 transition-opacity",
        color.chipClass,
        dense ? "leading-tight" : "text-xs px-2 py-1",
        isDragging && "opacity-40"
      )}
    >
      {event.repeat !== "none" && <Repeat className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
      {!event.allDay && <span className="shrink-0 tabular-nums">{format(occurrenceStart, "h:mm a")}</span>}
      <span className="truncate">{event.title || "Untitled event"}</span>
    </button>
  );
}

export const EventChip = memo(EventChipBase);
