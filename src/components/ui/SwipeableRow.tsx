import { useRef, useState, type ReactNode } from "react";
import { Check, Trash2 } from "lucide-react";

interface SwipeableRowProps {
  children: ReactNode;
  onSwipeRight?: () => void; // e.g. mark complete
  onSwipeLeft?: () => void; // e.g. delete
  disabled?: boolean;
}

const THRESHOLD = 72; // px of drag needed to trigger the action

/**
 * Wraps a row (task, note, habit, etc.) with touch-swipe gestures.
 * Swipe right reveals a green check action; swipe left reveals a red delete action.
 * Falls back to being a static container on pointer devices with no touch — the
 * underlying row's own buttons remain the primary way to act on desktop.
 */
export function SwipeableRow({ children, onSwipeRight, onSwipeLeft, disabled }: SwipeableRowProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled) return;
    startX.current = e.clientX;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    // Only allow drag in directions that have a registered handler.
    if (delta > 0 && !onSwipeRight) return;
    if (delta < 0 && !onSwipeLeft) return;
    const clamped = Math.max(-120, Math.min(120, delta));
    setDragX(clamped);
  }

  function handlePointerUp() {
    if (dragX >= THRESHOLD && onSwipeRight) onSwipeRight();
    else if (dragX <= -THRESHOLD && onSwipeLeft) onSwipeLeft();
    setDragX(0);
    setDragging(false);
    startX.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action backgrounds, revealed as the row is dragged */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div
          className="flex items-center gap-2 text-white transition-opacity"
          style={{ opacity: dragX > 20 ? Math.min(1, dragX / THRESHOLD) : 0 }}
        >
          <Check className="h-5 w-5" />
        </div>
        <div
          className="flex items-center gap-2 text-white ml-auto transition-opacity"
          style={{ opacity: dragX < -20 ? Math.min(1, -dragX / THRESHOLD) : 0 }}
        >
          <Trash2 className="h-5 w-5" />
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10 rounded-xl"
        style={{
          background:
            dragX > 0 ? "var(--color-success)" : dragX < 0 ? "var(--color-danger)" : "transparent",
        }}
      />
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 200ms ease-out",
          touchAction: onSwipeLeft || onSwipeRight ? "pan-y" : undefined,
        }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
