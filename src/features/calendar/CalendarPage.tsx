import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isSameDay,
  format,
  subMonths as subMonthsFn,
} from "date-fns";
import { Plus, BellRing } from "lucide-react";
import { useCalendarStore, type EventInput } from "@/features/calendar/calendar-store";
import { defaultCategories } from "@/features/calendar/categories";
import { expandOccurrences } from "@/features/calendar/occurrences";
import { toDateKey, getMonthGrid, getWeekDays } from "@/features/calendar/date-utils";
import {
  useReminderScheduler,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/features/calendar/reminders";
import { useDragReschedule } from "@/features/calendar/useDragReschedule";
import { CalendarSidebar, type AgendaFilter } from "@/features/calendar/components/CalendarSidebar";
import { CalendarToolbar, type CalendarView } from "@/features/calendar/components/CalendarToolbar";
import { MonthView } from "@/features/calendar/components/MonthView";
import { TimeGridView } from "@/features/calendar/components/TimeGridView";
import { AgendaView } from "@/features/calendar/components/AgendaView";
import { EventDetailsPanel } from "@/features/calendar/components/EventDetailsPanel";
import type { Occurrence } from "@/features/calendar/occurrences";

type PanelMode = "dayList" | "create" | "edit";
type CalendarSort = "date" | "created" | "title";

function sortOccurrences(occs: Occurrence[], sort: CalendarSort): Occurrence[] {
  const list = [...occs];
  switch (sort) {
    case "created":
      return list.sort((a, b) => b.event.createdAt.localeCompare(a.event.createdAt));
    case "title":
      return list.sort((a, b) => a.event.title.localeCompare(b.event.title));
    case "date":
    default:
      return list.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime());
  }
}

export function CalendarPage() {
  const {
    events,
    customCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    archiveEvent,
    unarchiveEvent,
    addCustomCategory,
  } = useCalendarStore();

  const [view, setView] = useState<CalendarView>("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [miniMonth, setMiniMonth] = useState(new Date());
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [agendaFilter, setAgendaFilter] = useState<AgendaFilter>("upcoming");
  const [agendaSort] = useState<CalendarSort>("date");

  const [panelMode, setPanelMode] = useState<PanelMode>("dayList");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...defaultCategories, ...customCategories], [customCategories]);

  useReminderScheduler(events);

  useEffect(() => {
    setMiniMonth(referenceDate);
  }, [referenceDate]);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      const tag = (el as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleStartCreate();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key.toLowerCase() === "t") handleToday();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, referenceDate]);

  const nonArchivedEvents = useMemo(() => events.filter((e) => !e.archived), [events]);

  function applyCommonFilters(occs: Occurrence[]): Occurrence[] {
    const q = search.trim().toLowerCase();
    return occs.filter((occ) => {
      if (activeCategory && occ.event.category !== activeCategory) return false;
      if (q) {
        const haystack = `${occ.event.title} ${occ.event.description} ${occ.event.location}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  const gridOccurrences = useMemo(() => {
    let rangeStart: Date;
    let rangeEnd: Date;
    if (view === "month") {
      const grid = getMonthGrid(referenceDate);
      rangeStart = startOfDay(grid[0][0]);
      rangeEnd = endOfDay(grid[grid.length - 1][6]);
    } else if (view === "week") {
      rangeStart = startOfWeek(referenceDate);
      rangeEnd = endOfWeek(referenceDate);
    } else {
      rangeStart = startOfDay(referenceDate);
      rangeEnd = endOfDay(referenceDate);
    }
    return applyCommonFilters(expandOccurrences(nonArchivedEvents, rangeStart, rangeEnd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, referenceDate, nonArchivedEvents, search, activeCategory]);

  const agendaOccurrences = useMemo(() => {
    const now = new Date();
    const rangeStart = subMonthsFn(now, 3);
    const rangeEnd = addMonths(now, 6);
    const sourceEvents = agendaFilter === "archived" ? events : nonArchivedEvents;
    const expanded = expandOccurrences(sourceEvents, rangeStart, rangeEnd);

    const dateFiltered = expanded.filter((occ) => {
      switch (agendaFilter) {
        case "today":
          return isSameDay(occ.occurrenceStart, now);
        case "upcoming":
          return occ.occurrenceEnd.getTime() >= now.getTime();
        case "thisWeek":
          return occ.occurrenceStart >= startOfWeek(now) && occ.occurrenceStart <= endOfWeek(now);
        case "thisMonth":
          return occ.occurrenceStart >= startOfMonth(now) && occ.occurrenceStart <= endOfMonth(now);
        case "completed":
          return occ.occurrenceEnd.getTime() < now.getTime() && !occ.event.archived;
        case "archived":
          return occ.event.archived;
        default:
          return true;
      }
    });

    return sortOccurrences(applyCommonFilters(dateFiltered), agendaSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, nonArchivedEvents, agendaFilter, search, activeCategory, agendaSort]);

  const eventDateKeys = useMemo(() => {
    const keys = new Set<string>();
    const monthStart = startOfMonth(miniMonth);
    const monthEnd = endOfMonth(miniMonth);
    for (const occ of expandOccurrences(nonArchivedEvents, monthStart, monthEnd)) {
      keys.add(toDateKey(occ.occurrenceStart));
    }
    return keys;
  }, [nonArchivedEvents, miniMonth]);

  const dayListOccurrences = useMemo(
    () =>
      gridOccurrences.filter(
        (occ) =>
          isSameDay(occ.occurrenceStart, selectedDate) ||
          (occ.occurrenceStart <= endOfDay(selectedDate) && occ.occurrenceEnd >= startOfDay(selectedDate))
      ),
    [gridOccurrences, selectedDate]
  );

  const editingEvent = useMemo(() => events.find((e) => e.id === editingEventId) ?? null, [events, editingEventId]);

  const drag = useDragReschedule((eventId, newDateKey) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const oldStart = new Date(event.startDate + "T00:00:00");
    const oldEnd = new Date(event.endDate + "T00:00:00");
    const spanDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / 86400000);
    const newStart = new Date(newDateKey + "T00:00:00");
    const newEnd = new Date(newStart.getTime() + spanDays * 86400000);
    updateEvent(eventId, { startDate: newDateKey, endDate: toDateKey(newEnd) });
  });

  function periodLabel(): string {
    if (view === "month") return format(referenceDate, "MMMM yyyy");
    if (view === "week") {
      const start = startOfWeek(referenceDate);
      const end = endOfWeek(referenceDate);
      return `${format(start, "MMM d")} \u2013 ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "day") return format(referenceDate, "EEEE, MMMM d, yyyy");
    return "Agenda";
  }

  function handlePrev() {
    if (view === "month") setReferenceDate((d) => subMonths(d, 1));
    else if (view === "week") setReferenceDate((d) => subWeeks(d, 1));
    else if (view === "day") setReferenceDate((d) => subDays(d, 1));
  }

  function handleNext() {
    if (view === "month") setReferenceDate((d) => addMonths(d, 1));
    else if (view === "week") setReferenceDate((d) => addWeeks(d, 1));
    else if (view === "day") setReferenceDate((d) => addDays(d, 1));
  }

  function handleToday() {
    const now = new Date();
    setReferenceDate(now);
    setSelectedDate(now);
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setReferenceDate(date);
    setPanelMode("dayList");
    setEditingEventId(null);
  }

  function handleOpenEvent(eventId: string) {
    setEditingEventId(eventId);
    setPanelMode("edit");
    const event = events.find((e) => e.id === eventId);
    if (event) setSelectedDate(new Date(event.startDate + "T00:00:00"));
  }

  function handleStartCreate() {
    setPanelMode("create");
    setEditingEventId(null);
  }

  function handleCancelPanel() {
    setPanelMode("dayList");
    setEditingEventId(null);
  }

  function handleSubmitCreate(values: EventInput) {
    createEvent(values);
    setPanelMode("dayList");
  }

  function handleSubmitEdit(values: EventInput) {
    if (editingEventId) updateEvent(editingEventId, values);
    setPanelMode("dayList");
    setEditingEventId(null);
  }

  function handleDuplicate() {
    if (!editingEventId) return;
    const newId = duplicateEvent(editingEventId);
    if (newId) setEditingEventId(newId);
  }

  function handleArchive() {
    if (!editingEventId) return;
    archiveEvent(editingEventId);
    handleCancelPanel();
  }

  function handleUnarchive() {
    if (!editingEventId) return;
    unarchiveEvent(editingEventId);
    handleCancelPanel();
  }

  function handleDelete() {
    if (!editingEventId) return;
    deleteEvent(editingEventId);
    handleCancelPanel();
  }

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  }

  const touchStartX = useRef<number | null>(null);
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || view !== "month") return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  }

  const panelOpen = panelMode !== "dayList";

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0 md:h-[calc(100vh-8.5rem)]">
      <div className="flex flex-col md:flex-row md:flex-1 gap-5 md:min-h-0">
        <div className="md:w-64 shrink-0 md:overflow-y-auto flex flex-col gap-4">
          <CalendarSidebar
            ref={searchInputRef}
            search={search}
            onSearchChange={setSearch}
            month={miniMonth}
            selectedDate={selectedDate}
            onMonthChange={setMiniMonth}
            onSelectDate={handleSelectDate}
            eventDateKeys={eventDateKeys}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onAddCategory={addCustomCategory}
            activeAgendaFilter={view === "agenda" ? agendaFilter : null}
            onAgendaFilterChange={(f) => {
              setAgendaFilter(f);
              setView("agenda");
            }}
            onCreateEvent={handleStartCreate}
          />

          {notifPermission === "default" && (
            <button
              onClick={handleEnableNotifications}
              className="hidden md:flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 h-10 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-accent-400"
            >
              <BellRing className="h-4 w-4 shrink-0" /> Enable reminder notifications
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4 md:overflow-y-auto">
          <CalendarToolbar
            view={view}
            onViewChange={setView}
            periodLabel={periodLabel()}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
          />

          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {view === "month" && (
              <MonthView
                month={referenceDate}
                selectedDate={selectedDate}
                occurrences={gridOccurrences}
                onSelectDate={handleSelectDate}
                onOpenEvent={handleOpenEvent}
                activeDragId={drag.activeDragId}
                dragOverDate={drag.dragOverDate}
                onEventPointerDown={drag.handlePointerDown}
                onEventPointerMove={drag.handlePointerMove}
                onEventPointerUp={drag.handlePointerUp}
                consumeWasDragged={drag.consumeWasDragged}
              />
            )}
            {view === "week" && (
              <TimeGridView
                days={getWeekDays(referenceDate)}
                occurrences={gridOccurrences}
                onOpenEvent={handleOpenEvent}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
              />
            )}
            {view === "day" && (
              <TimeGridView days={[referenceDate]} occurrences={gridOccurrences} onOpenEvent={handleOpenEvent} />
            )}
            {view === "agenda" && (
              <AgendaView
                occurrences={agendaOccurrences}
                onOpenEvent={handleOpenEvent}
                emptyMessage={`No events in "${agendaFilter}".`}
              />
            )}
          </div>
        </div>

        <div className={panelOpen ? "" : "hidden md:block"}>
          <div className="md:w-80 md:shrink-0 md:border md:border-[var(--color-border)] md:rounded-xl md:p-5 md:overflow-y-auto md:h-full">
            <EventDetailsPanel
              mode={panelMode}
              selectedDate={selectedDate}
              event={editingEvent}
              dayOccurrences={dayListOccurrences}
              categories={categories}
              fullScreenOnMobile
              onBack={handleCancelPanel}
              onCreateNew={handleStartCreate}
              onOpenEvent={handleOpenEvent}
              onSubmitCreate={handleSubmitCreate}
              onSubmitEdit={handleSubmitEdit}
              onCancelForm={handleCancelPanel}
              onDuplicate={panelMode === "edit" ? handleDuplicate : undefined}
              onArchive={panelMode === "edit" && editingEvent && !editingEvent.archived ? handleArchive : undefined}
              onUnarchive={panelMode === "edit" && editingEvent?.archived ? handleUnarchive : undefined}
              onDelete={panelMode === "edit" ? handleDelete : undefined}
            />
          </div>
        </div>
      </div>

      {!panelOpen && (
        <button
          onClick={handleStartCreate}
          aria-label="New event"
          className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
