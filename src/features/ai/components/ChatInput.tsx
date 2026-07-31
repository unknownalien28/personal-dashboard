import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Image as ImageIcon, Square, X, FileText, Loader2, AlertCircle } from "lucide-react";
import { useToastStore } from "@/lib/toast-store";
import { cn } from "@/lib/utils/cn";
import { validateFiles, uploadAttachment, formatBytes, type StagedUpload } from "@/features/ai/attachments";

const MAX_CHARS = 4000;
const MAX_HEIGHT_PX = 200;

interface ChatInputProps {
  onSend: (text: string, uploads: StagedUpload[]) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
}

interface StagedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  upload?: StagedUpload;
  controller: AbortController;
}

export function ChatInput({ onSend, disabled, isGenerating, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  // Abort any still-uploading files if the component unmounts mid-upload (e.g. navigating away).
  useEffect(() => {
    return () => {
      staged.forEach((s) => s.status === "uploading" && s.controller.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stageFiles(files: File[]) {
    const { valid, errors } = validateFiles(files, staged.length);
    errors.forEach((e) => showToast(`"${e.file.name}": ${e.reason}`, "error"));
    if (valid.length === 0) return;

    const entries: StagedFile[] = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "uploading",
      controller: new AbortController(),
    }));
    setStaged((prev) => [...prev, ...entries]);

    entries.forEach((entry) => {
      uploadAttachment(
        entry.file,
        (fraction) => {
          setStaged((prev) => prev.map((s) => (s.id === entry.id ? { ...s, progress: fraction } : s)));
        },
        entry.controller.signal,
      )
        .then((upload) => {
          setStaged((prev) => prev.map((s) => (s.id === entry.id ? { ...s, status: "done", progress: 1, upload } : s)));
        })
        .catch((err) => {
          if (entry.controller.signal.aborted) return; // removed by the user - not a real error
          const message = err instanceof Error ? err.message : "Upload failed";
          setStaged((prev) => prev.map((s) => (s.id === entry.id ? { ...s, status: "error", error: message } : s)));
        });
    });
  }

  function removeStaged(id: string) {
    setStaged((prev) => {
      const entry = prev.find((s) => s.id === id);
      if (entry?.status === "uploading") entry.controller.abort();
      return prev.filter((s) => s.id !== id);
    });
  }

  function handleSend() {
    const trimmed = value.trim();
    const stillUploading = staged.some((s) => s.status === "uploading");
    if (stillUploading) {
      showToast("Files are still uploading — hang on a moment.", "info");
      return;
    }
    const readyUploads = staged.filter((s) => s.status === "done" && s.upload).map((s) => s.upload!);
    if (!trimmed && readyUploads.length === 0) return;
    if (disabled) return;

    onSend(trimmed, readyUploads);
    setValue("");
    setStaged([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFilePick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again later
    if (files.length) stageFiles(files);
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
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) stageFiles(files);
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

      {staged.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {staged.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 text-xs max-w-[220px]"
              title={s.status === "error" ? s.error : `${s.file.name} · ${formatBytes(s.file.size)}`}
            >
              {s.status === "uploading" && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-zinc-400" />}
              {s.status === "error" && <AlertCircle className="h-3 w-3 shrink-0 text-danger" />}
              {s.status === "done" && <FileText className="h-3 w-3 shrink-0 text-accent-500" />}
              <span className="truncate">{s.file.name}</span>
              {s.status === "uploading" && <span className="text-zinc-400 shrink-0">{Math.round(s.progress * 100)}%</span>}
              <button
                type="button"
                onClick={() => removeStaged(s.id)}
                className="ml-0.5 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
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

      <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilePick} />
      <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilePick} />

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            title="Attach an image"
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
            disabled={(!value.trim() && staged.every((s) => s.status !== "done")) || overLimit || disabled}
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
