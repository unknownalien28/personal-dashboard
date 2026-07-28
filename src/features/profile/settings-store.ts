import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { AppearanceSettings, NotificationSettings, PreferenceSettings } from "@/types/models";

interface SettingsState {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  preferences: PreferenceSettings;
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updatePreferences: (updates: Partial<PreferenceSettings>) => void;
  resetSettings: () => void;
}

const defaultAppearance: AppearanceSettings = {
  accentColor: "indigo",
  fontSize: "medium",
  compactMode: false,
  reducedMotion: false,
};

const defaultNotifications: NotificationSettings = {
  calendarReminders: true,
  goalReminders: true,
  taskReminders: true,
};

const defaultPreferences: PreferenceSettings = {
  defaultCalendarView: "month",
  defaultNotesFilter: "all",
  defaultGoalView: "grid",
  startupPage: "/",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: defaultAppearance,
      notifications: defaultNotifications,
      preferences: defaultPreferences,
      updateAppearance: (updates) => set((s) => ({ appearance: { ...s.appearance, ...updates } })),
      updateNotifications: (updates) => set((s) => ({ notifications: { ...s.notifications, ...updates } })),
      updatePreferences: (updates) => set((s) => ({ preferences: { ...s.preferences, ...updates } })),
      resetSettings: () =>
        set({ appearance: defaultAppearance, notifications: defaultNotifications, preferences: defaultPreferences }),
    }),
    {
      name: `${STORAGE_PREFIX}settings`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
