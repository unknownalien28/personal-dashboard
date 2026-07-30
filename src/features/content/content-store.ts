import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { ContentPost, ContentPlatform, ContentStatus, Priority } from "@/types/models";
import { defaultContentCategories, defaultContentCampaigns } from "./status-config";

export interface ContentPostInput {
  title: string;
  description?: string;
  body?: string;
  platform: ContentPlatform;
  customPlatformName?: string;
  hashtags?: string[];
  mentions?: string[];
  status?: ContentStatus;
  priority?: Priority;
  category?: string;
  campaign?: string;
  tags?: string[];
  publishDate?: string | null;
  publishTime?: string | null;
  notes?: string;
  aiGenerated?: boolean;
}

interface ContentState {
  posts: ContentPost[];
  customCategories: string[];
  customCampaigns: string[];
  /**
   * The content document currently open in the workspace editor, if any.
   * The AI context engine reads this so the floating assistant automatically
   * knows what the user is working on without a manual context switch.
   */
  activeEditingId: string | null;

  createPost: (input: ContentPostInput) => string;
  updatePost: (id: string, updates: Partial<ContentPostInput>) => void;
  deletePost: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setStatus: (id: string, status: ContentStatus) => void;
  reschedule: (id: string, publishDate: string) => void;
  setActiveEditingId: (id: string | null) => void;
  addCustomCategory: (name: string) => void;
  addCustomCampaign: (name: string) => void;
}

function makePost(input: ContentPostInput): ContentPost {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? "",
    body: input.body ?? "",
    platform: input.platform,
    customPlatformName: input.customPlatformName ?? "",
    hashtags: input.hashtags ?? [],
    mentions: input.mentions ?? [],
    status: input.status ?? "idea",
    priority: input.priority ?? "medium",
    category: input.category ?? defaultContentCategories[0],
    campaign: input.campaign ?? defaultContentCampaigns[0],
    tags: input.tags ?? [],
    favorite: false,
    aiGenerated: input.aiGenerated ?? false,
    publishDate: input.publishDate ?? null,
    publishTime: input.publishTime ?? null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      posts: [],
      customCategories: [],
      customCampaigns: [],
      activeEditingId: null,

      createPost: (input) => {
        const post = makePost(input);
        set((s) => ({ posts: [post, ...s.posts] }));
        return post.id;
      },

      updatePost: (id, updates) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
        })),

      deletePost: (id) =>
        set((s) => ({
          posts: s.posts.filter((p) => p.id !== id),
          activeEditingId: s.activeEditingId === id ? null : s.activeEditingId,
        })),

      toggleFavorite: (id) =>
        set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),

      setStatus: (id, status) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
        })),

      reschedule: (id, publishDate) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, publishDate, status: p.status === "idea" ? "scheduled" : p.status, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      setActiveEditingId: (id) => set({ activeEditingId: id }),

      addCustomCategory: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.customCategories.includes(trimmed)) return s;
          return { customCategories: [...s.customCategories, trimmed] };
        }),

      addCustomCampaign: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.customCampaigns.includes(trimmed)) return s;
          return { customCampaigns: [...s.customCampaigns, trimmed] };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}content`,
      storage: createJSONStorage(() => storageAdapter),
      // The editor-open marker is ephemeral UI state, not data worth persisting across sessions.
      partialize: (s) => ({ posts: s.posts, customCategories: s.customCategories, customCampaigns: s.customCampaigns }),
    }
  )
);
