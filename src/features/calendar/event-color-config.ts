import type { EventColor } from "@/types/models";

export const eventColors: EventColor[] = ["default", "yellow", "blue", "green", "pink", "purple"];

interface ColorStyle {
  label: string;
  swatchClass: string;
  chipClass: string; // background + text for event chips in grid views
  dotClass: string; // small dot used in mini calendar / agenda
}

export const eventColorConfig: Record<EventColor, ColorStyle> = {
  default: {
    label: "Default",
    swatchClass: "bg-zinc-400 dark:bg-zinc-500",
    chipClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
  },
  yellow: {
    label: "Yellow",
    swatchClass: "bg-amber-400",
    chipClass: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    dotClass: "bg-amber-400",
  },
  blue: {
    label: "Blue",
    swatchClass: "bg-sky-400",
    chipClass: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
    dotClass: "bg-sky-400",
  },
  green: {
    label: "Green",
    swatchClass: "bg-emerald-400",
    chipClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
    dotClass: "bg-emerald-400",
  },
  pink: {
    label: "Pink",
    swatchClass: "bg-pink-400",
    chipClass: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300",
    dotClass: "bg-pink-400",
  },
  purple: {
    label: "Purple",
    swatchClass: "bg-violet-400",
    chipClass: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
    dotClass: "bg-violet-400",
  },
};
