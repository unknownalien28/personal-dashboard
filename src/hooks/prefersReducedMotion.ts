export function prefersReducedMotion(): boolean {
  const osPreference = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const manualToggle = typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");
  return !!osPreference || !!manualToggle;
}
