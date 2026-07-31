import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Minus, X, GripHorizontal } from "lucide-react";
import { useFloatingAssistantStore } from "@/features/ai/floating-assistant-store";
import { useConversationsStore } from "@/features/ai/conversations-store";
import { useCurrentPageModule } from "@/features/ai/use-current-page-module";
import type { ModuleKey as ModuleKeyType } from "@/features/ai/context-engine";
import {
  sendUserMessage,
  regenerateMessage,
  retryMessage,
  stopGenerating,
  confirmPendingAction,
  cancelPendingAction,
} from "@/features/ai/chat-service";
import { ChatWindow } from "@/features/ai/components/ChatWindow";
import type { StagedUpload } from "@/features/ai/attachments";

export function FloatingAssistant() {
  const { pathname } = useLocation();
  const { isOpen, isMinimized, open, close, minimize, restore } = useFloatingAssistantStore();
  const conversations = useConversationsStore((s) => s.conversations);
  const activeConversationId = useConversationsStore((s) => s.activeConversationId);
  const createConversation = useConversationsStore((s) => s.createConversation);
  const setActiveConversation = useConversationsStore((s) => s.setActiveConversation);
  const pageModules = useCurrentPageModule();

  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragOrigin = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const conversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const lastAssistantMessage = conversation
    ? [...conversation.messages].reverse().find((m) => m.role === "assistant")
    : undefined;
  const isGenerating = lastAssistantMessage?.status === "streaming";

  // The full Alien Assistant page already IS this experience - showing the floating bubble on top of it would be redundant.
  if (pathname.startsWith("/ai")) return null;

  function ensureConversation(): string {
    if (activeConversationId) return activeConversationId;
    const id = createConversation();
    setActiveConversation(id);
    return id;
  }

  function handleSend(text: string, module?: ModuleKeyType, uploads?: StagedUpload[]) {
    const modules = module ? Array.from(new Set([...pageModules, module])) : pageModules;
    void sendUserMessage(ensureConversation(), text, modules, uploads ?? []);
  }

  function handleDragStart(e: ReactPointerEvent<HTMLDivElement>) {
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, originX: drag.x, originY: drag.y };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function handleDragMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    const { startX, startY, originX, originY } = dragOrigin.current;
    setDrag({ x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) });
  }
  function handleDragEnd() {
    dragOrigin.current = null;
    setIsDragging(false);
  }

  if (!isOpen || isMinimized) {
    return (
      <button
        type="button"
        onClick={() => (isMinimized ? restore() : open())}
        aria-label="Open Alien Assistant"
        className="fixed z-30 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 hover:bg-accent-600 transition-colors nav-glow"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed z-30 inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[380px] md:h-[560px] flex flex-col rounded-none md:rounded-2xl overflow-hidden border-0 md:border border-[var(--color-border)] glass-panel shadow-2xl floating-panel-in"
      style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
    >
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className={`hidden md:flex items-center gap-2 px-3 h-11 border-b border-[var(--color-border)] shrink-0 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <GripHorizontal className="h-4 w-4 text-zinc-400 shrink-0" />
        <Bot className="h-4 w-4 text-accent-500 shrink-0" />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate flex-1">Alien Assistant</span>
        <button
          type="button"
          onClick={minimize}
          aria-label="Minimize"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile header - full-screen panel gets a simpler bar since there's nowhere to drag it to. */}
      <div className="md:hidden flex items-center gap-2 px-4 h-14 border-b border-[var(--color-border)] shrink-0 pt-[env(safe-area-inset-top)]">
        <Bot className="h-4 w-4 text-accent-500 shrink-0" />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate flex-1">Alien Assistant</span>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ChatWindow
        messages={conversation?.messages ?? []}
        onSend={handleSend}
        onRegenerate={(id) => activeConversationId && void regenerateMessage(activeConversationId, id)}
        onRetry={(id) => activeConversationId && void retryMessage(activeConversationId, id)}
        onStop={() => lastAssistantMessage && stopGenerating(lastAssistantMessage.id)}
        onConfirmAction={(id) => activeConversationId && confirmPendingAction(activeConversationId, id)}
        onCancelAction={(id) => activeConversationId && cancelPendingAction(activeConversationId, id)}
        isGenerating={isGenerating}
      />
    </div>
  );
}
