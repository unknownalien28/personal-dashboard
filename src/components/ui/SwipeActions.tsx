import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SwipeAction {
  key: string;
  label: string;
  icon: ReactNode;
  colorClass: string; // background color class for the revealed button
  onAction: () => void;
}

interface SwipeActionsProps {
  children: ReactNode;
  leadingActions?: SwipeAction[]; // revealed by dragging content to the right
  trailingActions?: SwipeAction[]; // revealed by dragging content to the left
}

const ACTION_WIDTH = 72;

/**
 * A native-feeling swipe row: dragging reveals actions as tappable buttons
 * (rather than auto-firing on release), matching Mail/Gmail-style swipe lists.
 * Used by Notes, which needs more than the two auto-trigger actions Tasks uses.
 */
export function SwipeActions({ children, leadingActions = [], trailingActions = [] }: SwipeActionsProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const startOffset = useRef(0);

  const leadingWidth = leadingActions.length * ACTION_WIDTH;
  const trailingWidth = trailingActions.length * ACTION_WIDTH;

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startOffset.current = offset;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    let next = startOffset.current + delta;
    next = Math.max(-trailingWidth, Math.min(leadingWidth, next));
    setOffset(next);
  }

  function handlePointerUp() {
    setDragging(false);
    startX.current = null;
    // Snap open if dragged past half the available width, otherwise snap closed.
    if (offset > leadingWidth / 2) setOffset(leadingWidth);
    else if (offset < -trailingWidth / 2) setOffset(-trailingWidth);
    else setOffset(0);
  }

  function runAction(action: SwipeAction) {
    action.onAction();
    setOffset(0);
  }

  function handleContentClick(e: React.MouseEvent) {
    if (offset !== 0) {
      e.preventDefault();
      e.stopPropagation();
      setOffset(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {leadingActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex" style={{ width: leadingWidth }}>
          {leadingActions.map((action) => (
            <button
              key={action.key}
              onClick={() => runAction(action)}
              aria-label={action.label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-medium",
                action.colorClass
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
      {trailingActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width: trailingWidth }}>
          {trailingActions.map((action) => (
            <button
              key={action.key}
              onClick={() => runAction(action)}
              aria-label={action.label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-medium",
                action.colorClass
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleContentClick}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 200ms ease-out",
          touchAction: leadingActions.length || trailingActions.length ? "pan-y" : undefined,
        }}
        className="relative bg-[var(--color-canvas)]"
      >
        {children}
      </div>
    </div>
  );
}
