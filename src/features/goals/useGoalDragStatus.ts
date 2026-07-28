import { useRef, useState } from "react";
import type { GoalStatus } from "@/types/models";

const MOVE_THRESHOLD = 8;

/** Drag a goal card onto a Kanban column (columns must carry data-status="..."). */
export function useGoalDragStatus(onDrop: (goalId: string, status: GoalStatus) => void) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<GoalStatus | null>(null);
  const draggingId = useRef<string | null>(null);
  const originPos = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  function handlePointerDown(goalId: string, e: React.PointerEvent) {
    draggingId.current = goalId;
    originPos.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setActiveDragId(goalId);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingId.current || !originPos.current) return;
    const dx = e.clientX - originPos.current.x;
    const dy = e.clientY - originPos.current.y;
    if (!moved.current && Math.hypot(dx, dy) > MOVE_THRESHOLD) moved.current = true;
    if (!moved.current) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const column = el?.closest<HTMLElement>("[data-status]");
    setDragOverStatus((column?.dataset.status as GoalStatus) ?? null);
  }

  function handlePointerUp() {
    if (draggingId.current && moved.current && dragOverStatus) {
      onDrop(draggingId.current, dragOverStatus);
    }
    draggingId.current = null;
    originPos.current = null;
    setActiveDragId(null);
    setDragOverStatus(null);
  }

  function consumeWasDragged(): boolean {
    const was = moved.current;
    moved.current = false;
    return was;
  }

  return { activeDragId, dragOverStatus, handlePointerDown, handlePointerMove, handlePointerUp, consumeWasDragged };
}
