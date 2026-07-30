import { useContentStore, type ContentPostInput } from "@/features/content/content-store";
import { ok, fail, type ToolResult } from "./types";
import type { ContentPost } from "@/types/models";

function activePosts(): ContentPost[] {
  return useContentStore.getState().posts;
}

function findByTitle(query: string): ContentPost | undefined {
  const q = query.trim().toLowerCase();
  return activePosts().find((p) => p.title.toLowerCase().includes(q));
}

export function getContent(): ToolResult<ContentPost[]> {
  const posts = activePosts();
  return ok(`Found ${posts.length} content item(s).`, posts);
}

export function searchContent(query: string): ToolResult<ContentPost[]> {
  const q = query.trim().toLowerCase();
  const results = activePosts().filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.campaign.toLowerCase().includes(q)
  );
  return ok(`Found ${results.length} content item(s) matching "${query}".`, results);
}

export function createContentPost(input: ContentPostInput): ToolResult<{ id: string }> {
  if (!input.title?.trim()) return fail("Content needs a title.");
  const id = useContentStore.getState().createPost(input);
  return ok(`Created "${input.title}".`, { id });
}

export function updateContentPost(idOrTitle: string, updates: Partial<ContentPostInput>): ToolResult<{ id: string }> {
  const post = activePosts().find((p) => p.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!post) return fail(`Couldn't find content matching "${idOrTitle}".`);
  useContentStore.getState().updatePost(post.id, updates);
  return ok(`Updated "${post.title}".`, { id: post.id });
}

export function deleteContentPost(idOrTitle: string): ToolResult<{ id: string }> {
  const post = activePosts().find((p) => p.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!post) return fail(`Couldn't find content matching "${idOrTitle}".`);
  useContentStore.getState().deletePost(post.id);
  return ok(`Deleted "${post.title}".`, { id: post.id });
}
