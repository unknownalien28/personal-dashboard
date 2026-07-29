import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/hooks/prefersReducedMotion";

/**
 * Animates a number counting up (or down) toward `target` whenever it changes,
 * using an ease-out curve. Falls back to the exact target instantly when
 * reduced motion is preferred - CSS's blanket animation-duration override
 * doesn't touch requestAnimationFrame loops, so this needs its own check.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const fromValue = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      fromValue.current = target;
      return;
    }

    const start = fromValue.current;
    if (start === target) return;

    const startTime = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(start + (target - start) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromValue.current = target;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
