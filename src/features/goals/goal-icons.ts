import {
  Target,
  Trophy,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Wallet,
  Rocket,
  BookOpen,
  Dumbbell,
  Home,
  Plane,
  Code,
  Palette,
  Music,
  Users,
  Star,
  type LucideIcon,
} from "lucide-react";

export const goalIconKeys = [
  "target",
  "trophy",
  "briefcase",
  "graduationCap",
  "heartPulse",
  "wallet",
  "rocket",
  "bookOpen",
  "dumbbell",
  "home",
  "plane",
  "code",
  "palette",
  "music",
  "users",
  "star",
] as const;

export type GoalIconKey = (typeof goalIconKeys)[number];

export const goalIconMap: Record<GoalIconKey, LucideIcon> = {
  target: Target,
  trophy: Trophy,
  briefcase: Briefcase,
  graduationCap: GraduationCap,
  heartPulse: HeartPulse,
  wallet: Wallet,
  rocket: Rocket,
  bookOpen: BookOpen,
  dumbbell: Dumbbell,
  home: Home,
  plane: Plane,
  code: Code,
  palette: Palette,
  music: Music,
  users: Users,
  star: Star,
};

export function getGoalIcon(key: string): LucideIcon {
  return goalIconMap[key as GoalIconKey] ?? Target;
}
