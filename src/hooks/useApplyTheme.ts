import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme-store";

/** Applies the current theme mode to <html> so Tailwind's dark: variant works app-wide. */
export function useApplyTheme() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", mode === "dark");
  }, [mode]);
}
