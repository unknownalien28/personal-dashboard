import { useEffect } from "react";
import { useSettingsStore } from "@/features/profile/settings-store";
import { accentColorShades } from "@/lib/accent-colors";

const FONT_SIZE_PX: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Applies appearance settings globally by writing to the same CSS custom
 * properties (--color-accent-*) and a couple of html classes the rest of the
 * app already reads — no component needs to know settings exist.
 */
export function useApplyAppearance() {
  const { accentColor, fontSize, compactMode, reducedMotion } = useSettingsStore((s) => s.appearance);

  useEffect(() => {
    const root = window.document.documentElement;
    const shades = accentColorShades[accentColor];
    root.style.setProperty("--color-accent-50", shades[50]);
    root.style.setProperty("--color-accent-100", shades[100]);
    root.style.setProperty("--color-accent-400", shades[400]);
    root.style.setProperty("--color-accent-500", shades[500]);
    root.style.setProperty("--color-accent-600", shades[600]);
    root.style.setProperty("--color-accent-700", shades[700]);

    const [r, g, b] = hexToRgb(shades[500]);
    root.style.setProperty("--atmosphere-r", String(r));
    root.style.setProperty("--atmosphere-g", String(g));
    root.style.setProperty("--atmosphere-b", String(b));
  }, [accentColor]);

  useEffect(() => {
    window.document.documentElement.style.fontSize = FONT_SIZE_PX[fontSize] ?? FONT_SIZE_PX.medium;
  }, [fontSize]);

  useEffect(() => {
    window.document.documentElement.classList.toggle("compact", compactMode);
  }, [compactMode]);

  useEffect(() => {
    window.document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);
}
