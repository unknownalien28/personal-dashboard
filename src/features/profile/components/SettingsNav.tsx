import { User, Palette, Bell, SlidersHorizontal, Database, Info, ChevronRight, Sparkles, Bot, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SettingsSection =
  | "profile"
  | "appearance"
  | "visualEffects"
  | "ai"
  | "notifications"
  | "preferences"
  | "security"
  | "data"
  | "about";

const sections: { value: SettingsSection; label: string; icon: typeof User; description: string }[] = [
  { value: "profile", label: "Profile", icon: User, description: "Name, avatar, and identity" },
  { value: "appearance", label: "Appearance", icon: Palette, description: "Theme, accent color, density" },
  { value: "visualEffects", label: "Visual Effects", icon: Sparkles, description: "Ambient background, glow, and glass" },
  { value: "ai", label: "AI", icon: Bot, description: "Provider, model, and API key for Alien Assistant" },
  { value: "notifications", label: "Notifications", icon: Bell, description: "Reminders across the app" },
  { value: "preferences", label: "Preferences", icon: SlidersHorizontal, description: "Default views and startup page" },
  { value: "security", label: "Security", icon: ShieldCheck, description: "Password and active sessions" },
  { value: "data", label: "Data Management", icon: Database, description: "Export, import, and storage" },
  { value: "about", label: "About", icon: Info, description: "Version, shortcuts, credits" },
];

interface SettingsNavProps {
  active: SettingsSection | null;
  onSelect: (section: SettingsSection) => void;
}

export function SettingsNav({ active, onSelect }: SettingsNavProps) {
  return (
    <nav aria-label="Settings sections" className="flex flex-col gap-0.5">
      {sections.map((s) => (
        <button
          key={s.value}
          onClick={() => onSelect(s.value)}
          aria-current={active === s.value}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 h-14 md:h-11 text-left transition-colors duration-150",
            active === s.value
              ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <s.icon className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium truncate">{s.label}</span>
            <span className="hidden md:block text-xs text-zinc-400 dark:text-zinc-500 truncate">{s.description}</span>
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600 md:hidden shrink-0" />
        </button>
      ))}
    </nav>
  );
}
