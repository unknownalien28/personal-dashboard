import { format } from "date-fns";
import { ArrowLeft, Copy, Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventForm } from "@/features/calendar/components/EventForm";
import { EventChip } from "@/features/calendar/components/EventChip";
import type { EventInput } from "@/features/calendar/calendar-store";
import type { CalendarEvent } from "@/types/models";
import type { Occurrence } from "@/features/calendar/occurrences";
import { cn } from "@/lib/utils/cn";

type PanelMode = "dayList" | "create" | "edit";

interface EventDetailsPanelProps {
  mode: PanelMode;
  selectedDate: Date;
  event: CalendarEvent | null;
  dayOccurrences: Occurrence[];
  categories: string[];
  fullScreenOnMobile?: boolean;
  onBack: () => void;
  onCreateNew: () => void;
  onOpenEvent: (eventId: string) => void;
  onSubmitCreate: (values: EventInput) => void;
  onSubmitEdit: (values: EventInput) => void;
  onCancelForm: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
}

export function EventDetailsPanel({
  mode,
  selectedDate,
  event,
  dayOccurrences,
  categories,
  fullScreenOnMobile,
  onBack,
  onCreateNew,
  onOpenEvent,
  onSubmitCreate,
  onSubmitEdit,
  onCancelForm,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: EventDetailsPanelProps) {
  const showBack = mode !== "dayList";

  return (
    <div
      className={cn(
        "flex flex-col bg-[var(--color-canvas)] md:bg-transparent",
        fullScreenOnMobile && mode !== "dayList" && "fixed inset-0 z-40 md:relative md:inset-auto md:z-auto"
      )}
      role="region"
      aria-label="Event details"
    >
      <div className="flex items-center gap-1 px-3 md:px-0 h-14 md:h-auto md:pb-3 border-b md:border-b-0 border-[var(--color-border)] pt-[env(safe-area-inset-top)] md:pt-0 shrink-0">
        {showBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-2">
          {mode === "dayList"
            ? format(selectedDate, "EEEE, MMMM d")
            : mode === "create"
              ? "New event"
              : "Edit event"}
        </h2>

        {mode === "edit" && (
          <div className="flex items-center gap-0.5">
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                aria-label="Duplicate event"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Copy className="h-[18px] w-[18px]" />
              </button>
            )}
            {onArchive && (
              <button
                onClick={onArchive}
                aria-label="Archive event"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Archive className="h-[18px] w-[18px]" />
              </button>
            )}
            {onUnarchive && (
              <button
                onClick={onUnarchive}
                aria-label="Restore event"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArchiveRestore className="h-[18px] w-[18px]" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                aria-label="Delete event"
                className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-3 pb-[env(safe-area-inset-bottom)]">
        {mode === "dayList" && (
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={onCreateNew} className="w-full">
              <Plus className="h-4 w-4" /> Add event
            </Button>
            {dayOccurrences.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">
                No events on this day.
              </p>
            ) : (
              <ul role="list" className="flex flex-col gap-1.5">
                {dayOccurrences.map((occ) => (
                  <li key={`${occ.event.id}-${occ.occurrenceStart.getTime()}`}>
                    <EventChip occurrence={occ} onClick={() => onOpenEvent(occ.event.id)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {mode === "create" && (
          <EventForm defaultDate={selectedDate} categories={categories} onSubmit={onSubmitCreate} onCancel={onCancelForm} />
        )}

        {mode === "edit" && event && (
          <EventForm initial={event} categories={categories} onSubmit={onSubmitEdit} onCancel={onCancelForm} />
        )}
      </div>
    </div>
  );
}
