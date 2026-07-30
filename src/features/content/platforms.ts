import type { LucideIcon } from "lucide-react";
import { AtSign, Users, Camera, Briefcase, Video, Hash, MessageCircle, Send, Phone, Rss, Sparkles } from "lucide-react";
import type { ContentPlatform } from "@/types/models";

export interface PlatformConfig {
  label: string;
  icon: LucideIcon;
  colorVar: string; // CSS color used for calendar dots / badges - kept as real hex so it reads correctly regardless of accent color
}

export const platformConfig: Record<ContentPlatform, PlatformConfig> = {
  x: { label: "X (Twitter)", icon: AtSign, colorVar: "#000000" },
  facebook: { label: "Facebook", icon: Users, colorVar: "#1877f2" },
  instagram: { label: "Instagram", icon: Camera, colorVar: "#e1306c" },
  linkedin: { label: "LinkedIn", icon: Briefcase, colorVar: "#0a66c2" },
  tiktok: { label: "TikTok", icon: Hash, colorVar: "#111827" },
  youtube: { label: "YouTube", icon: Video, colorVar: "#ff0000" },
  threads: { label: "Threads", icon: MessageCircle, colorVar: "#6b7280" },
  telegram: { label: "Telegram", icon: Send, colorVar: "#26a5e4" },
  whatsapp: { label: "WhatsApp Channel", icon: Phone, colorVar: "#25d366" },
  blog: { label: "Blog", icon: Rss, colorVar: "#f97316" },
  custom: { label: "Custom", icon: Sparkles, colorVar: "#8b5cf6" },
};

export const platformOptions: { value: ContentPlatform; label: string }[] = (
  Object.keys(platformConfig) as ContentPlatform[]
).map((value) => ({ value, label: platformConfig[value].label }));
