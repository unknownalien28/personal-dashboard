export interface ParsedLine {
  index: number;
  raw: string;
  type: "h1" | "h2" | "h3" | "checklist" | "bullet" | "numbered" | "blank" | "paragraph";
  text: string;
  checked?: boolean;
  marker?: string;
}

/** Classifies each line of Markdown source for block-level rendering. */
export function parseMarkdownLines(content: string): ParsedLine[] {
  return content.split("\n").map((raw, index) => {
    if (raw.trim() === "") return { index, raw, type: "blank", text: "" };

    const h3 = raw.match(/^###\s+(.*)/);
    if (h3) return { index, raw, type: "h3", text: h3[1] };
    const h2 = raw.match(/^##\s+(.*)/);
    if (h2) return { index, raw, type: "h2", text: h2[1] };
    const h1 = raw.match(/^#\s+(.*)/);
    if (h1) return { index, raw, type: "h1", text: h1[1] };

    const checklist = raw.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
    if (checklist) {
      return { index, raw, type: "checklist", text: checklist[2], checked: checklist[1].toLowerCase() === "x" };
    }

    const numbered = raw.match(/^(\d+)\.\s+(.*)/);
    if (numbered) return { index, raw, type: "numbered", text: numbered[2], marker: `${numbered[1]}.` };

    const bullet = raw.match(/^[-*]\s+(.*)/);
    if (bullet) return { index, raw, type: "bullet", text: bullet[1] };

    return { index, raw, type: "paragraph", text: raw };
  });
}

/** Toggles a checklist line's [ ]/[x] state and returns the updated full content string. */
export function toggleChecklistLine(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  const line = lines[lineIndex];
  if (!line) return content;
  if (/\[ \]/.test(line)) {
    lines[lineIndex] = line.replace("[ ]", "[x]");
  } else if (/\[x\]/i.test(line)) {
    lines[lineIndex] = line.replace(/\[x\]/i, "[ ]");
  }
  return lines.join("\n");
}

/** Plain-text preview snippet with Markdown syntax stripped, used in note list cards. */
export function stripMarkdown(content: string): string {
  return content
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

export function countWords(content: string): number {
  const trimmed = content.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
