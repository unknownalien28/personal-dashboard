import type { ReactNode } from "react";
import { Fragment } from "react";
import { CodeBlock } from "./CodeBlock";

const FENCE_PATTERN = /```(\w*)\n([\s\S]*?)```/g;

interface TextSegment {
  type: "text";
  content: string;
}
interface CodeSegment {
  type: "code";
  language: string;
  code: string;
}

function splitCodeFences(content: string): (TextSegment | CodeSegment)[] {
  const segments: (TextSegment | CodeSegment)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  FENCE_PATTERN.lastIndex = 0;

  while ((match = FENCE_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", language: match[1], code: match[2] });
    lastIndex = FENCE_PATTERN.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }
  return segments;
}

/** Renders **bold**, *italic*, `inline code`, and [links](url) within a single line of plain text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(pattern);
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[13px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={key}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="text-accent-500 underline underline-offset-2 hover:text-accent-600"
        >
          {link[1]}
        </a>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 1) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function renderTextBlock(content: string, keyPrefix: string): ReactNode {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`${keyPrefix}-ul-${listKey++}`} className="list-disc pl-5 my-1.5 flex flex-col gap-0.5">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `${keyPrefix}-li-${listKey}-${i}`)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((line, i) => {
    const key = `${keyPrefix}-${i}`;
    if (line.trim() === "") {
      flushList();
      return;
    }
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    const bullet = line.match(/^[-*]\s+(.*)/);

    if (h3) {
      flushList();
      blocks.push(
        <h3 key={key} className="text-sm font-semibold mt-2 mb-1">
          {renderInline(h3[1], key)}
        </h3>
      );
    } else if (h2) {
      flushList();
      blocks.push(
        <h2 key={key} className="text-base font-semibold mt-2 mb-1">
          {renderInline(h2[1], key)}
        </h2>
      );
    } else if (h1) {
      flushList();
      blocks.push(
        <h1 key={key} className="text-lg font-semibold mt-2 mb-1">
          {renderInline(h1[1], key)}
        </h1>
      );
    } else if (bullet) {
      listItems.push(bullet[1]);
    } else {
      flushList();
      blocks.push(
        <p key={key} className="leading-relaxed">
          {renderInline(line, key)}
        </p>
      );
    }
  });
  flushList();
  return blocks;
}

export function ChatMarkdown({ content }: { content: string }) {
  const segments = splitCodeFences(content);
  return (
    <div className="text-sm text-zinc-800 dark:text-zinc-200 flex flex-col gap-0.5">
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock key={i} code={seg.code} language={seg.language} />
        ) : (
          <Fragment key={i}>{renderTextBlock(seg.content, `seg-${i}`)}</Fragment>
        )
      )}
    </div>
  );
}
