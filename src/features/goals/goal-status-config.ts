import type { GoalStatus } from "@/types/models";

export const goalStatuses: GoalStatus[] = ["notStarted", "inProgress", "onHold", "completed"];

export const goalStatusConfig: Record<GoalStatus, { label: string; tone: "neutral" | "accent" | "warning" | "success" }> = {
  notStarted: { label: "Not Started", tone: "neutral" },
  inProgress: { label: "In Progress", tone: "accent" },
  onHold: { label: "On Hold", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};
