import { useConversationsStore } from "@/features/ai/conversations-store";
import { ok, fail, type ToolResult } from "./types";
import type { Conversation } from "@/types/models";

export function searchConversations(query: string): ToolResult<Conversation[]> {
  const q = query.trim().toLowerCase();
  const results = useConversationsStore
    .getState()
    .conversations.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)));
  return ok(`Found ${results.length} conversation(s) matching "${query}".`, results);
}

export function deleteConversationTool(id: string): ToolResult<{ id: string }> {
  const convo = useConversationsStore.getState().conversations.find((c) => c.id === id);
  if (!convo) return fail("Couldn't find that conversation.");
  useConversationsStore.getState().deleteConversation(id);
  return ok(`Deleted "${convo.title}".`, { id });
}
