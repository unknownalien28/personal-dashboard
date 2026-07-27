import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. Thin wrapper so we have one place to extend later (e.g. tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
