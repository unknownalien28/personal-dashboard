import { useEffect } from "react";
import { Plus, ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConversationsStore } from "@/features/ai/conversations-store";
import { ConversationSidebar } from "@/features/ai/components/ConversationSidebar";
import { ChatWindow } from "@/features/ai/components/ChatWindow";
import { sendUserMessage, regenerateMessage, retryMessage, stopGenerating, confirmPendingAction, cancelPendingAction } from "@/features/ai/chat-service";
import type { ModuleKey } from "@/features/ai/context-engine";

export function AIPage() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    togglePin,
    renameConversation,
    deleteConversation,
  } = useConversationsStore();

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const lastAssistantMessage = activeConversation
    ? [...activeConversation.messages].reverse().find((m) => m.role === "assistant")
    : undefined;
  const isGenerating = lastAssistantMessage?.status === "streaming";

  // Land on the most recently active conversation on first visit, if any exist.
  useEffect(() => {
    if (activeConversationId === null && conversations.length > 0) {
      const mostRecent = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      setActiveConversation(mostRecent.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewChat() {
    createConversation();
  }

  function handleSend(text: string, module?: ModuleKey) {
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = createConversation(text);
    }
    void sendUserMessage(conversationId, text, module ? [module] : []);
  }

  function handleRegenerate(messageId: string) {
    if (activeConversationId) void regenerateMessage(activeConversationId, messageId);
  }

  function handleRetry(messageId: string) {
    if (activeConversationId) void retryMessage(activeConversationId, messageId);
  }

  function handleStop() {
    if (lastAssistantMessage) stopGenerating(lastAssistantMessage.id);
  }

  function handleConfirmAction(messageId: string) {
    if (activeConversationId) confirmPendingAction(activeConversationId, messageId);
  }

  function handleCancelAction(messageId: string) {
    if (activeConversationId) cancelPendingAction(activeConversationId, messageId);
  }

  function handleDelete(id: string) {
    deleteConversation(id);
  }

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0 h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)]">
      <div className="hidden md:flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Alien Assistant</h2>
        </div>
        <Button variant="primary" onClick={handleNewChat}>
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 rounded-2xl md:border md:border-[var(--color-border)] md:overflow-hidden">
        {/* Conversation list: full-screen on mobile until a chat is open, a fixed pane on desktop. */}
        <div
          className={
            activeConversation
              ? "hidden md:flex md:w-72 md:shrink-0 md:border-r md:border-[var(--color-border)] glass-panel"
              : "flex flex-1 md:flex-none md:w-72 md:shrink-0 md:border-r md:border-[var(--color-border)] glass-panel"
          }
        >
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={setActiveConversation}
            onNewChat={handleNewChat}
            onTogglePin={togglePin}
            onRename={renameConversation}
            onDelete={handleDelete}
          />
        </div>

        {/* Chat: full-screen overlay on mobile once a conversation is open. */}
        <div className={activeConversation ? "flex flex-1 min-w-0 flex-col glass-panel md:bg-transparent" : "hidden md:flex flex-1 min-w-0 flex-col"}>
          {activeConversation && (
            <div className="md:hidden flex items-center gap-2 px-3 h-12 border-b border-[var(--color-border)] shrink-0">
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium truncate">{activeConversation.title}</span>
            </div>
          )}

          <ChatWindow
            messages={activeConversation?.messages ?? []}
            onSend={handleSend}
            onRegenerate={handleRegenerate}
            onRetry={handleRetry}
            onStop={handleStop}
            onConfirmAction={handleConfirmAction}
            onCancelAction={handleCancelAction}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
