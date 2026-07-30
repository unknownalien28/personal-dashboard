import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type { ChatMessage, ChatMessageStatus, Conversation } from "@/types/models";

interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: string | null;

  createConversation: (firstMessage?: string) => string;
  setActiveConversation: (id: string | null) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  deleteConversation: (id: string) => void;

  addMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt">) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Pick<ChatMessage, "content" | "status" | "errorMessage" | "action">>
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  /** Removes every message from `messageId` onward - used before regenerating/retrying a response. */
  truncateFrom: (conversationId: string, messageId: string) => void;
  setStatus: (conversationId: string, messageId: string, status: ChatMessageStatus) => void;
  /** Records the authoritative backend Conversation id once the first backend reply comes back — see chat-service.ts. */
  setBackendId: (conversationId: string, backendId: string) => void;
}

function makeConversation(title: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    pinned: false,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function titleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

export const useConversationsStore = create<ConversationsState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: (firstMessage) => {
        const convo = makeConversation(firstMessage ? titleFromMessage(firstMessage) : "New chat");
        set((s) => ({
          conversations: [convo, ...s.conversations],
          activeConversationId: convo.id,
        }));
        return convo.id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title: title.trim() || c.title, updatedAt: new Date().toISOString() } : c
          ),
        })),

      togglePin: (id) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
        })),

      deleteConversation: (id) =>
        set((s) => {
          const remaining = s.conversations.filter((c) => c.id !== id);
          const wasActive = s.activeConversationId === id;
          return {
            conversations: remaining,
            activeConversationId: wasActive ? null : s.activeConversationId,
          };
        }),

      addMessage: (conversationId, message) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const isFirstUserMessage = c.messages.length === 0 && message.role === "user";
            return {
              ...c,
              title: isFirstUserMessage ? titleFromMessage(message.content) : c.title,
              messages: [...c.messages, { ...message, id, createdAt: now }],
              updatedAt: now,
            };
          }),
        }));
        return id;
      },

      updateMessage: (conversationId, messageId, updates) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
                  updatedAt: new Date().toISOString(),
                }
          ),
        })),

      deleteMessage: (conversationId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id !== conversationId ? c : { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          ),
        })),

      truncateFrom: (conversationId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const idx = c.messages.findIndex((m) => m.id === messageId);
            if (idx === -1) return c;
            return { ...c, messages: c.messages.slice(0, idx) };
          }),
        })),

      setStatus: (conversationId, messageId, status) => {
        get().updateMessage(conversationId, messageId, { status });
      },

      setBackendId: (conversationId, backendId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, backendId } : c)),
        })),
    }),
    {
      name: `${STORAGE_PREFIX}ai-conversations`,
      storage: createJSONStorage(() => storageAdapter),
      partialize: (s) => ({ conversations: s.conversations, activeConversationId: s.activeConversationId }),
    }
  )
);
