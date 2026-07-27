import { memo, type ReactNode } from "react";
import { parseMarkdownLines } from "@/features/notes/markdown";

let inlineKey = 0;

/** Renders **bold**, *italic*, `code`, and [links](url) within a single line of text. */
function renderInline(text: string): ReactNode[] {
  if (!text) return [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern).filter((p) => p !== "");

  return parts.map((part) => {
    const key = `inline-${inlineKey++}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[0.85em] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-600 dark:text-accent-400 underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

interface MarkdownPreviewProps {
  content: string;
  onToggleCheckbox?: (lineIndex: number) => void;
}

function MarkdownPreviewBase({ content, onToggleCheckbox }: MarkdownPreviewProps) {
  const lines = parseMarkdownLines(content);

  if (content.trim() === "") {
    return <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">Nothing to preview yet.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      {lines.map((line) => {
        switch (line.type) {
          case "blank":
            return <div key={line.index} className="h-2" aria-hidden="true" />;
          case "h1":
            return (
              <h1 key={line.index} className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
                {renderInline(line.text)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={line.index} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
                {renderInline(line.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={line.index} className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
                {renderInline(line.text)}
              </h3>
            );
          case "checklist":
            return (
              <label key={line.index} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={line.checked}
                  onChange={() => onToggleCheckbox?.(line.index)}
                  className="mt-1 h-4 w-4 shrink-0 rounded accent-accent-500 cursor-pointer"
                  aria-label={line.checked ? "Mark item incomplete" : "Mark item complete"}
                />
                <span className={line.checked ? "line-through text-zinc-400 dark:text-zinc-500" : ""}>
                  {renderInline(line.text)}
                </span>
              </label>
            );
          case "bullet":
            return (
              <div key={line.index} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-400 mt-1.5 h-1 w-1 rounded-full bg-current shrink-0" />
                <span>{renderInline(line.text)}</span>
              </div>
            );
          case "numbered":
            return (
              <div key={line.index} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-400 tabular-nums shrink-0">{line.marker}</span>
                <span>{renderInline(line.text)}</span>
              </div>
            );
          default:
            return <p key={line.index}>{renderInline(line.text)}</p>;
        }
      })}
    </div>
  );
}

export const MarkdownPreview = memo(MarkdownPreviewBase);
