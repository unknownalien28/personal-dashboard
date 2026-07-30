import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  CalendarDays,
  Target,
  Wallet,
  Megaphone,
  Bot,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for app navigation — sidebar (desktop) and bottom nav (mobile) both read from this. */
export const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/goals", label: "Goals & Habits", icon: Target },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/content", label: "Content Planner", icon: Megaphone },
  { to: "/ai", label: "Alien Assistant", icon: Bot },
  { to: "/profile", label: "Profile", icon: User },
];
