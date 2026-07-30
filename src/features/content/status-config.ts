import type { ContentStatus } from "@/types/models";

export const statusConfig: Record<ContentStatus, { label: string; tone: "neutral" | "accent" | "warning" | "success" }> = {
  idea: { label: "Idea", tone: "neutral" },
  researching: { label: "Researching", tone: "accent" },
  writing: { label: "Writing", tone: "accent" },
  editing: { label: "Editing", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "accent" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
};

export const statusOrder: ContentStatus[] = ["idea", "researching", "writing", "editing", "scheduled", "published", "archived"];

export const defaultContentCategories = ["Social", "Blog", "Video", "Newsletter", "Campaign"];
export const defaultContentCampaigns = ["General"];
