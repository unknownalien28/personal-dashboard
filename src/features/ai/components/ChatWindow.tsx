import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { FollowUpChips } from "./FollowUpChips";
import type { ChatMessage } from "@/types/models";
import type { ModuleKey } from "@/features/ai/context-engine";
import type { StagedUpload } from "@/features/ai/attachments";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (text: string, module?: ModuleKey, uploads?: StagedUpload[]) => void;
  onRegenerate: (messageId: string) => void;
  onRetry: (messageId: string) => void;
  onStop: () => void;
  onConfirmAction: (messageId: string) => void;
  onCancelAction: (messageId: string) => void;
  isGenerating: boolean;
}

export function ChatWindow({
  messages,
  onSend,
  onRegenerate,
  onRetry,
  onStop,
  onConfirmAction,
  onCancelAction,
  isGenerating,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    if (stickToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // Re-run on every content change (streaming) as well as message count changes.
  }, [messages, stickToBottom]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom < 120);
  }

  function handleAsk(prompt: string, module?: string) {
    onSend(prompt, module as ModuleKey | undefined);
  }

  function handleComposerSend(text: string, uploads: StagedUpload[]) {
    onSend(text, undefined, uploads);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <WelcomeScreen onSuggestionClick={handleAsk} />
        <div className="p-4 max-w-3xl w-full mx-auto">
          <ChatInput onSend={handleComposerSend} isGenerating={isGenerating} onStop={onStop} />
        </div>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto py-6 flex flex-col gap-5">
          {messages.map((m) => (
            <div key={m.id}>
              <MessageBubble
                message={m}
                onRegenerate={m.role === "assistant" ? () => onRegenerate(m.id) : undefined}
                onRetry={m.role === "assistant" && m.status === "error" ? () => onRetry(m.id) : undefined}
                onConfirmAction={() => onConfirmAction(m.id)}
                onCancelAction={() => onCancelAction(m.id)}
              />
              {m.id === lastMessage.id && !isGenerating && <FollowUpChips message={m} onAsk={handleAsk} />}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="p-4 max-w-3xl w-full mx-auto">
        <ChatInput onSend={handleComposerSend} isGenerating={isGenerating} onStop={onStop} />
      </div>
    </div>
  );
}
