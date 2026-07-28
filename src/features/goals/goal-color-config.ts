import type { NoteColor } from "@/types/models";

export const goalColors: NoteColor[] = ["default", "yellow", "blue", "green", "pink", "purple"];

interface ColorStyle {
  label: string;
  swatchClass: string;
  ringClass: string; // used for the goal card's icon badge background
}

export const goalColorConfig: Record<NoteColor, ColorStyle> = {
  default: { label: "Default", swatchClass: "bg-zinc-400 dark:bg-zinc-500", ringClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  yellow: { label: "Yellow", swatchClass: "bg-amber-400", ringClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  blue: { label: "Blue", swatchClass: "bg-sky-400", ringClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
  green: { label: "Green", swatchClass: "bg-emerald-400", ringClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  pink: { label: "Pink", swatchClass: "bg-pink-400", ringClass: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300" },
  purple: { label: "Purple", swatchClass: "bg-violet-400", ringClass: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
};
