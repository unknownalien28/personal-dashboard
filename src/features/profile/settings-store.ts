import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import { api } from "@/lib/api/client";
import type {
  AISettings,
  AppearanceSettings,
  NotificationSettings,
  PreferenceSettings,
  VisualEffectsSettings,
} from "@/types/models";

interface SettingsState {
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  preferences: PreferenceSettings;
  visualEffects: VisualEffectsSettings;
  ai: AISettings;
  updateAppearance: (updates: Partial<AppearanceSettings>) => void;
  updateNotifications: (updates: Partial<NotificationSettings>) => void;
  updatePreferences: (updates: Partial<PreferenceSettings>) => void;
  updateVisualEffects: (updates: Partial<VisualEffectsSettings>) => void;
  /** `sync: false` updates local state only (used to hydrate from the backend without re-PATCHing it right back) — defaults to true, which also persists the change to `PATCH /users/me/settings/ai`. */
  updateAISettings: (updates: Partial<AISettings>, options?: { sync?: boolean }) => void;
  resetSettings: () => void;
}

const defaultAppearance: AppearanceSettings = {
  accentColor: "alienBlue",
  fontSize: "medium",
  compactMode: false,
  reducedMotion: false,
};

const defaultVisualEffects: VisualEffectsSettings = {
  ambientBackground: true,
  floatingPlanets: true,
  starField: true,
  floatingParticles: true,
  mouseParallax: true,
  glowEffects: true,
  glassEffects: true,
  reducedVisualEffects: false,
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

const defaultAISettings: AISettings = {
  enabled: true,
  provider: "auto",
  model: "",
  streaming: true,
  temperature: 0.7,
  maxTokens: 1024,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: defaultAppearance,
      notifications: defaultNotifications,
      preferences: defaultPreferences,
      visualEffects: defaultVisualEffects,
      ai: defaultAISettings,
      updateAppearance: (updates) => set((s) => ({ appearance: { ...s.appearance, ...updates } })),
      updateNotifications: (updates) => set((s) => ({ notifications: { ...s.notifications, ...updates } })),
      updatePreferences: (updates) => set((s) => ({ preferences: { ...s.preferences, ...updates } })),
      updateVisualEffects: (updates) => set((s) => ({ visualEffects: { ...s.visualEffects, ...updates } })),
      updateAISettings: (updates, options) => {
        set((s) => ({ ai: { ...s.ai, ...updates } }));
        if (options?.sync === false) return;
        // Fire-and-forget: the backend is the source of truth (see
        // AiOrchestratorService.resolveProvider); local state already
        // updated optimistically above so the UI responds instantly.
        api.patch("/users/me/settings/ai", updates).catch(() => {
          // Non-fatal — the next successful sync (or app reload, which
          // re-hydrates from the backend) will reconcile any drift.
        });
      },
      resetSettings: () =>
        // Deliberately does not reset `ai` - the user's provider/model
        // preference is synced with the backend and shouldn't disappear
        // just because someone resets appearance/notification/preference defaults.
        set({
          appearance: defaultAppearance,
          notifications: defaultNotifications,
          preferences: defaultPreferences,
          visualEffects: defaultVisualEffects,
        }),
    }),
    {
      name: `${STORAGE_PREFIX}settings`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
