import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { tokenizeLine, TOKEN_CLASS } from "./syntax-highlight";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable - silently ignore, copy button just won't confirm
    }
  }

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-[var(--color-border)] bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between px-3 h-8 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-mono">{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed font-mono">
        <code>
          {lines.map((line, i) => (
            <div key={i}>
              {line.length === 0 ? (
                "\u00A0"
              ) : (
                tokenizeLine(line).map((tok, j) => (
                  <span key={j} className={TOKEN_CLASS[tok.kind]}>
                    {tok.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
