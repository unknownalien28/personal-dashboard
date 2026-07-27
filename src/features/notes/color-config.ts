import type { NoteColor } from "@/types/models";

export const noteColors: NoteColor[] = ["default", "yellow", "blue", "green", "pink", "purple"];

interface ColorStyle {
  label: string;
  swatchClass: string; // used by the color picker dot
  accentClass: string; // left accent bar on the note card
}

export const noteColorConfig: Record<NoteColor, ColorStyle> = {
  default: {
    label: "Default",
    swatchClass: "bg-zinc-300 dark:bg-zinc-600",
    accentClass: "bg-zinc-300 dark:bg-zinc-600",
  },
  yellow: {
    label: "Yellow",
    swatchClass: "bg-amber-400",
    accentClass: "bg-amber-400",
  },
  blue: {
    label: "Blue",
    swatchClass: "bg-sky-400",
    accentClass: "bg-sky-400",
  },
  green: {
    label: "Green",
    swatchClass: "bg-emerald-400",
    accentClass: "bg-emerald-400",
  },
  pink: {
    label: "Pink",
    swatchClass: "bg-pink-400",
    accentClass: "bg-pink-400",
  },
  purple: {
    label: "Purple",
    swatchClass: "bg-violet-400",
    accentClass: "bg-violet-400",
  },
};
