import { useEffect, useState } from "react";
import { useSettingsStore } from "@/features/profile/settings-store";

/**
 * Resolves the ambient-space visual effects into a single set of flags that
 * everything else (AmbientBackground, glow/glass CSS hooks) reads from.
 *
 * Three inputs are combined:
 *  - the OS-level `prefers-reduced-motion` query (always respected)
 *  - the app-wide "Reduced motion" toggle in Settings > Appearance
 *  - the individual Settings > Visual Effects toggles
 *
 * Reduced motion never fully hides the background — it just stops the
 * looping animations (planets/particles/parallax) while keeping glow/glass
 * for depth, since those read as static lighting, not motion.
 */
export function useVisualEffects() {
  const visualEffects = useSettingsStore((s) => s.visualEffects);
  const reducedMotionSetting = useSettingsStore((s) => s.appearance.reducedMotion);
  const [osReducedMotion, setOsReducedMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const motionDisabled = osReducedMotion || reducedMotionSetting;
  const lite = visualEffects.reducedVisualEffects;

  return {
    ambientBackground: visualEffects.ambientBackground,
    floatingPlanets: visualEffects.floatingPlanets && !lite,
    starField: visualEffects.starField,
    floatingParticles: visualEffects.floatingParticles && !lite,
    mouseParallax: visualEffects.mouseParallax && !motionDisabled && !lite,
    glowEffects: visualEffects.glowEffects,
    glassEffects: visualEffects.glassEffects,
    motionDisabled,
    lite,
  };
}
