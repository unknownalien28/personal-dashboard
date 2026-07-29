import { useEffect, useRef } from "react";

/**
 * Writes `--parallax-x` / `--parallax-y` (range roughly -1..1) onto the given
 * element as the pointer moves, throttled to one update per animation frame.
 * Background layers translate a few px per depth using these variables; the
 * dashboard content itself never reads them, so it stays perfectly stable.
 */
export function useMouseParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let frame = 0;
    let pendingX = 0;
    let pendingY = 0;

    const apply = () => {
      frame = 0;
      el.style.setProperty("--parallax-x", pendingX.toFixed(4));
      el.style.setProperty("--parallax-y", pendingY.toFixed(4));
    };

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      pendingX = (e.clientX / w) * 2 - 1;
      pendingY = (e.clientY / h) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty("--parallax-x");
      el.style.removeProperty("--parallax-y");
    };
  }, [enabled]);

  return ref;
}
