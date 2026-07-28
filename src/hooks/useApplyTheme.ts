import { useEffect, useState } from "react";
import { useThemeStore, systemPrefersDark } from "@/lib/theme-store";

/** Resolves "system" mode against the OS preference, updating live if the OS preference changes. */
export function useResolvedDarkMode(): boolean {
  const mode = useThemeStore((s) => s.mode);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return mode === "system" ? systemDark : mode === "dark";
}

/** Applies the resolved theme to <html> so Tailwind's dark: variant works app-wide. */
export function useApplyTheme() {
  const isDark = useResolvedDarkMode();

  useEffect(() => {
    window.document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
}
