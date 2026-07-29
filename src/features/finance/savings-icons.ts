import { Target, Plane, Home, Car, GraduationCap, Gift, Shield, Laptop, Heart, Umbrella, type LucideIcon } from "lucide-react";

export const savingsIconKeys = ["target", "plane", "home", "car", "graduationCap", "gift", "shield", "laptop", "heart", "umbrella"] as const;

export type SavingsIconKey = (typeof savingsIconKeys)[number];

export const savingsIconLabels: Record<SavingsIconKey, string> = {
  target: "Target",
  plane: "Travel",
  home: "Home",
  car: "Car",
  graduationCap: "Education",
  gift: "Gift",
  shield: "Protection",
  laptop: "Tech",
  heart: "Health",
  umbrella: "Emergency fund",
};

export const savingsIconMap: Record<SavingsIconKey, LucideIcon> = {
  target: Target,
  plane: Plane,
  home: Home,
  car: Car,
  graduationCap: GraduationCap,
  gift: Gift,
  shield: Shield,
  laptop: Laptop,
  heart: Heart,
  umbrella: Umbrella,
};

export function getSavingsIcon(key: string): LucideIcon {
  return savingsIconMap[key as SavingsIconKey] ?? Target;
}
