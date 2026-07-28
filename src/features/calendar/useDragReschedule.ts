import { useRef, useState } from "react";

const MOVE_THRESHOLD = 8; // px of movement before a press counts as a drag rather than a tap/click

/**
 * Pointer Events unify mouse and touch, so this one hook drives drag-to-reschedule
 * on both desktop and mobile. Day cells must carry a `data-date="yyyy-MM-dd"`
 * attribute for the drop target to be found via elementFromPoint.
 */
export function useDragReschedule(onReschedule: (eventId: string, newDateKey: string) => void) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);
  const originPos = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  function handlePointerDown(eventId: string, e: React.PointerEvent) {
    draggingId.current = eventId;
    originPos.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setActiveDragId(eventId);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingId.current || !originPos.current) return;
    const dx = e.clientX - originPos.current.x;
    const dy = e.clientY - originPos.current.y;
    if (!moved.current && Math.hypot(dx, dy) > MOVE_THRESHOLD) moved.current = true;
    if (!moved.current) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest<HTMLElement>("[data-date]");
    setDragOverDate(cell?.dataset.date ?? null);
  }

  function handlePointerUp() {
    if (draggingId.current && moved.current && dragOverDate) {
      onReschedule(draggingId.current, dragOverDate);
    }
    draggingId.current = null;
    originPos.current = null;
    setActiveDragId(null);
    setDragOverDate(null);
  }

  /** Call from onClick before opening an event — swallows the click that follows a drag. */
  function consumeWasDragged(): boolean {
    const was = moved.current;
    moved.current = false;
    return was;
  }

  return {
    activeDragId,
    dragOverDate,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    consumeWasDragged,
  };
}
