import { useFloatingAssistantStore } from "@/features/ai/floating-assistant-store";
import { useConversationsStore } from "@/features/ai/conversations-store";
import { sendUserMessage } from "@/features/ai/chat-service";
import type { ModuleKey } from "@/features/ai/context-engine";

/**
 * Opens the floating assistant panel and sends `prompt` through the exact
 * same chat engine as the full Alien Assistant page - reused by AI shortcut
 * buttons (Part 7) and the command palette's "Ask Alien" entry (Part 6).
 */
export function askAlien(prompt: string, forceModules: ModuleKey[] = []): void {
  const floating = useFloatingAssistantStore.getState();
  floating.open();

  const conversations = useConversationsStore.getState();
  const conversationId = conversations.activeConversationId ?? conversations.createConversation(prompt);
  if (!conversations.activeConversationId) {
    conversations.setActiveConversation(conversationId);
  }

  void sendUserMessage(conversationId, prompt, forceModules);
}
