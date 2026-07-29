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
  alienBlue: "Alien Blue",
  cosmicPurple: "Cosmic Purple",
  auroraGreen: "Aurora Green",
  solarOrange: "Solar Orange",
  crimsonRed: "Crimson Red",
  sakuraPink: "Sakura Pink",
};

/** Swatch color shown in the picker (the 500 shade). */
export const accentColorSwatch: Record<AccentColorKey, string> = {
  alienBlue: "#2563eb",
  cosmicPurple: "#7c3aed",
  auroraGreen: "#22c55e",
  solarOrange: "#f59e0b",
  crimsonRed: "#ef4444",
  sakuraPink: "#ec4899",
};

export const accentColorShades: Record<AccentColorKey, AccentShades> = {
  alienBlue: { 50: "#eff6ff", 100: "#dbeafe", 400: "#60a5fa", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af" },
  cosmicPurple: { 50: "#f5f3ff", 100: "#ede9fe", 400: "#a78bfa", 500: "#7c3aed", 600: "#6d28d9", 700: "#5b21b6" },
  auroraGreen: { 50: "#f0fdf4", 100: "#dcfce7", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d" },
  solarOrange: { 50: "#fffbeb", 100: "#fef3c7", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" },
  crimsonRed: { 50: "#fef2f2", 100: "#fee2e2", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
  sakuraPink: { 50: "#fdf2f8", 100: "#fce7f3", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d" },
};
