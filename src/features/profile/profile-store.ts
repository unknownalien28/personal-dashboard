import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { Profile } from "@/types/models";

interface ProfileState extends Profile {
  updateProfile: (updates: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      name: "there",
      role: "",
      avatarColor: "#5e6ad2",
      avatarDataUrl: null,
      email: "",
      bio: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      language: "en",
      updateProfile: (updates) => set(updates),
    }),
    {
      name: `${STORAGE_PREFIX}profile`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
