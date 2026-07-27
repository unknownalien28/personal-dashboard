import type { Priority } from "@/types/models";

export const priorityConfig: Record<Priority, { label: string; tone: "success" | "warning" | "danger" }> = {
  low: { label: "Low", tone: "success" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "danger" },
};

export const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
