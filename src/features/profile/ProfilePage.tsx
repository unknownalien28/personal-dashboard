import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { SettingsNav, type SettingsSection } from "@/features/profile/components/SettingsNav";
import { ProfileSection } from "@/features/profile/components/ProfileSection";
import { AppearanceSection } from "@/features/profile/components/AppearanceSection";
import { VisualEffectsSection } from "@/features/profile/components/VisualEffectsSection";
import { AISection } from "@/features/profile/components/AISection";
import { NotificationsSection } from "@/features/profile/components/NotificationsSection";
import { PreferencesSection } from "@/features/profile/components/PreferencesSection";
import { DataManagementSection } from "@/features/profile/components/DataManagementSection";
import { AboutSection } from "@/features/profile/components/AboutSection";

const sectionLabels: Record<SettingsSection, string> = {
  profile: "Profile",
  appearance: "Appearance",
  visualEffects: "Visual Effects",
  ai: "AI",
  notifications: "Notifications",
  preferences: "Preferences",
  data: "Data Management",
  about: "About",
};

function renderSection(section: SettingsSection) {
  switch (section) {
    case "profile":
      return <ProfileSection />;
    case "appearance":
      return <AppearanceSection />;
    case "visualEffects":
      return <VisualEffectsSection />;
    case "ai":
      return <AISection />;
    case "notifications":
      return <NotificationsSection />;
    case "preferences":
      return <PreferencesSection />;
    case "data":
      return <DataManagementSection />;
    case "about":
      return <AboutSection />;
  }
}

export function ProfilePage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSelect(section: SettingsSection) {
    setActiveSection(section);
    setMobileOpen(true);
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 pb-24 md:pb-0">
      {/* Desktop: nav always visible. Mobile: nav list shown only until a section is opened. */}
      <div className={mobileOpen ? "hidden md:block md:w-64 md:shrink-0" : "md:w-64 md:shrink-0"}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 md:hidden">Profile & Settings</h2>
        <SettingsNav active={activeSection} onSelect={handleSelect} />
      </div>

      {/* Desktop: content always visible. Mobile: full-screen overlay once a section is opened. */}
      <div
        className={
          mobileOpen
            ? "fixed inset-0 z-40 flex flex-col bg-[var(--color-canvas)] md:relative md:inset-auto md:z-auto md:flex-1 md:min-w-0"
            : "hidden md:block md:flex-1 md:min-w-0"
        }
      >
        <div className="flex items-center gap-1 px-3 md:px-0 h-14 md:h-auto md:pb-4 border-b md:border-b-0 border-[var(--color-border)] pt-[env(safe-area-inset-top)] md:pt-0 shrink-0">
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Back to settings"
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 px-2 md:hidden">
            {sectionLabels[activeSection]}
          </h2>
          <h2 className="hidden md:block text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {sectionLabels[activeSection]}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-0 py-4 pb-[env(safe-area-inset-bottom)]">
          {renderSection(activeSection)}
        </div>
      </div>
    </div>
  );
}
