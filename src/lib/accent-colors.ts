import type { AccentColorKey } from "@/types/models";

interface AccentShades {
  50: string;
  100: string;
  400: string;
  500: string;
  600: string;
  700: string;
}

export const accentColorLabels: Record<AccentColorKey, string> = {
  indigo: "Indigo",
  blue: "Blue",
  green: "Green",
  rose: "Rose",
  orange: "Orange",
  violet: "Violet",
};

/** Swatch color shown in the picker (the 500 shade). */
export const accentColorSwatch: Record<AccentColorKey, string> = {
  indigo: "#5e6ad2",
  blue: "#3b82f6",
  green: "#16a34a",
  rose: "#e11d48",
  orange: "#ea580c",
  violet: "#8b5cf6",
};

export const accentColorShades: Record<AccentColorKey, AccentShades> = {
  indigo: { 50: "#eef0fd", 100: "#dde1fb", 400: "#7c87e8", 500: "#5e6ad2", 600: "#4c56b8", 700: "#3d4494" },
  blue: { 50: "#eff6ff", 100: "#dbeafe", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
  green: { 50: "#f0fdf4", 100: "#dcfce7", 400: "#4ade80", 500: "#16a34a", 600: "#15803d", 700: "#166534" },
  rose: { 50: "#fff1f2", 100: "#ffe4e6", 400: "#fb7185", 500: "#e11d48", 600: "#be123c", 700: "#9f1239" },
  orange: { 50: "#fff7ed", 100: "#ffedd5", 400: "#fb923c", 500: "#ea580c", 600: "#c2410c", 700: "#9a3412" },
  violet: { 50: "#f5f3ff", 100: "#ede9fe", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9" },
};
