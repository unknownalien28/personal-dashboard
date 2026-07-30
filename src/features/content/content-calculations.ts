import type { ContentPost, ContentPlatform } from "@/types/models";

export interface ContentCounts {
  total: number;
  ideas: number;
  drafts: number; // researching + writing + editing
  scheduled: number;
  published: number;
  archived: number;
}

export function computeContentCounts(posts: ContentPost[]): ContentCounts {
  return {
    total: posts.length,
    ideas: posts.filter((p) => p.status === "idea").length,
    drafts: posts.filter((p) => p.status === "researching" || p.status === "writing" || p.status === "editing").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
    archived: posts.filter((p) => p.status === "archived").length,
  };
}

export interface PlatformDistributionEntry {
  platform: ContentPlatform;
  count: number;
}

export function computePlatformDistribution(posts: ContentPost[]): PlatformDistributionEntry[] {
  const map = new Map<ContentPlatform, number>();
  for (const p of posts) map.set(p.platform, (map.get(p.platform) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

export interface CategoryDistributionEntry {
  category: string;
  count: number;
}

export function computeCategoryDistribution(posts: ContentPost[]): CategoryDistributionEntry[] {
  const map = new Map<string, number>();
  for (const p of posts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Consecutive days (ending today, going backward) with at least one published post. */
export function computePostingStreak(posts: ContentPost[]): number {
  const publishedDates = new Set(
    posts.filter((p) => p.status === "published" && p.publishDate).map((p) => p.publishDate as string)
  );
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (publishedDates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // today doesn't break a streak that continues from yesterday
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/** Percentage of the last 30 days that had at least one published post. */
export function computePostingConsistency(posts: ContentPost[]): number {
  const publishedDates = new Set(
    posts.filter((p) => p.status === "published" && p.publishDate).map((p) => p.publishDate as string)
  );
  let hit = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    if (publishedDates.has(cursor.toISOString().slice(0, 10))) hit++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return Math.round((hit / 30) * 100);
}

export function upcomingPosts(posts: ContentPost[], limit = 5): ContentPost[] {
  const today = new Date().toISOString().slice(0, 10);
  return posts
    .filter((p) => p.publishDate && p.publishDate >= today && p.status !== "archived")
    .sort((a, b) => (a.publishDate ?? "").localeCompare(b.publishDate ?? ""))
    .slice(0, limit);
}
