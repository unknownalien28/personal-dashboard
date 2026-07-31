import { useState } from "react";
import { Bot, Check, Copy, RotateCcw, AlertTriangle, FileText } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useProfileStore } from "@/features/profile/profile-store";
import { ChatMarkdown } from "./ChatMarkdown";
import { TypingIndicator } from "./TypingIndicator";
import { ActionCard } from "./ActionCard";
import { stripAttachmentBlocks, formatBytes } from "@/features/ai/attachments";
import type { ChatMessage } from "@/types/models";

interface MessageBubbleProps {
  message: ChatMessage;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MessageBubble({ message, onRegenerate, onRetry, onConfirmAction, onCancelAction }: MessageBubbleProps) {
  const profile = useProfileStore();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const displayContent = isUser ? stripAttachmentBlocks(message.content) : message.content;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable - copy button just won't confirm
    }
  }

  return (
    <div className={`flex gap-3 items-start item-in ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <Avatar name={profile.name} color={profile.avatarColor} dataUrl={profile.avatarDataUrl} size="sm" />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
          <Bot className="h-4 w-4 text-accent-500" />
        </div>
      )}

      <div className={`flex flex-col gap-1 min-w-0 max-w-[85%] md:max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-sm bg-accent-500 text-white px-4 py-2.5"
              : "rounded-2xl rounded-tl-sm glass-panel border border-[var(--color-border)] px-4 py-2.5"
          }
        >
          {message.status === "streaming" && message.content === "" ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
          ) : (
            <ChatMarkdown content={message.content} />
          )}

          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((a) => (
                <a
                  key={a.url}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1 text-xs text-white/90 hover:bg-white/25 transition-colors"
                  title={a.contentIncluded ? "Content included in this message" : "Referenced by link only"}
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[140px]">{a.filename}</span>
                  <span className="text-white/60">{formatBytes(a.size)}</span>
                </a>
              ))}
            </div>
          )}

          {message.status === "error" && (
            <div className="flex items-center gap-1.5 text-xs text-danger mt-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {message.errorMessage ?? "Something went wrong."}
            </div>
          )}

          {message.action && onConfirmAction && onCancelAction && (
            <ActionCard action={message.action} onConfirm={onConfirmAction} onCancel={onCancelAction} />
          )}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{formatTime(message.createdAt)}</span>

          {!isUser && message.status === "complete" && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}

          {!isUser && message.status === "error" && onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} className="h-6 px-2 text-xs">
              <RotateCcw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
