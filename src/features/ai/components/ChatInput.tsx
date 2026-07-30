import { useEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Image as ImageIcon, Square } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils/cn";

const MAX_CHARS = 4000;
const MAX_HEIGHT_PX = 200;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, disabled, isGenerating, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function notImplemented() {
    showToast("Attachments are coming in a future update.", "info");
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(true);
  }
  function handleDragLeave() {
    setIsDraggingOver(false);
  }
  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    notImplemented();
  }

  const overLimit = value.length > MAX_CHARS;

  return (
    <div
      className={cn(
        "relative rounded-2xl border glass-panel transition-colors",
        isDraggingOver ? "border-accent-400 bg-accent-50/40 dark:bg-accent-500/10" : "border-[var(--color-border)]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-accent-50/70 dark:bg-accent-500/15 pointer-events-none">
          <p className="text-sm font-medium text-accent-600 dark:text-accent-400">Drop files to attach</p>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Alien Assistant…"
        rows={1}
        disabled={disabled}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        style={{ maxHeight: MAX_HEIGHT_PX }}
      />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={notImplemented}
            title="Attach a file (coming soon)"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={notImplemented}
            title="Attach an image (coming soon)"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <span className={cn("text-[11px] ml-1", overLimit ? "text-danger" : "text-zinc-400 dark:text-zinc-500")}>
            {value.length}/{MAX_CHARS}
          </span>
        </div>

        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || overLimit || disabled}
            title="Send message"
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
