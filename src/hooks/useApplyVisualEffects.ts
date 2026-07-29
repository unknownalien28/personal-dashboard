import { useEffect } from "react";
import { useSettingsStore } from "@/features/profile/settings-store";

/**
 * Mirrors the pattern in useApplyAppearance: toggles html classes so CSS can
 * turn a surface's glow/glass off in one place (see index.css) instead of
 * threading boolean props through every Card/Sidebar/Topbar usage.
 */
export function useApplyVisualEffects() {
  const { glowEffects, glassEffects, ambientBackground, floatingPlanets, starField, floatingParticles } =
    useSettingsStore((s) => s.visualEffects);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("no-glow-effects", !glowEffects);
    root.classList.toggle("no-glass-effects", !glassEffects);
    root.classList.toggle("no-ambient-bg", !ambientBackground);
    root.classList.toggle("no-planets", !floatingPlanets);
    root.classList.toggle("no-star-field", !starField);
    root.classList.toggle("no-particles", !floatingParticles);
  }, [glowEffects, glassEffects, ambientBackground, floatingPlanets, starField, floatingParticles]);
}
