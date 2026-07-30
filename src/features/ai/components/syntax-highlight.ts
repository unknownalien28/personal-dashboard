const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "break",
  "continue", "class", "extends", "implements", "interface", "type", "enum", "import", "export", "from", "as",
  "default", "new", "delete", "typeof", "instanceof", "in", "of", "async", "await", "try", "catch", "finally",
  "throw", "yield", "static", "public", "private", "protected", "readonly", "abstract", "void", "null",
  "undefined", "true", "false", "this", "super", "def", "elif", "lambda", "pass", "with", "raise", "except",
  "None", "True", "False", "self", "print", "fn", "impl", "match", "struct", "trait", "pub", "mod", "use",
  "select", "insert", "update", "delete", "where", "join", "group", "order", "by", "into",
]);

interface Token {
  text: string;
  kind: "keyword" | "string" | "comment" | "number" | "punctuation" | "plain";
}

const TOKEN_PATTERN =
  /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([{}()[\];,.:=<>+\-*/%!&|^~?])/g;

/** Tokenizes one line of code for color-coding. Best-effort across languages, not a full parser. */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;

  while ((match = TOKEN_PATTERN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), kind: "plain" });
    }
    const [full, comment, str, num, word, punct] = match;
    if (comment) tokens.push({ text: full, kind: "comment" });
    else if (str) tokens.push({ text: full, kind: "string" });
    else if (num) tokens.push({ text: full, kind: "number" });
    else if (word) tokens.push({ text: full, kind: KEYWORDS.has(full) ? "keyword" : "plain" });
    else if (punct) tokens.push({ text: full, kind: "punctuation" });
    lastIndex = TOKEN_PATTERN.lastIndex;
  }
  if (lastIndex < line.length) tokens.push({ text: line.slice(lastIndex), kind: "plain" });
  return tokens;
}

export const TOKEN_CLASS: Record<Token["kind"], string> = {
  keyword: "text-[#c586c0] dark:text-[#c586c0]",
  string: "text-[#0a8754] dark:text-[#ce9178]",
  comment: "text-zinc-400 dark:text-zinc-500 italic",
  number: "text-[#b5860a] dark:text-[#b5cea8]",
  punctuation: "text-zinc-500 dark:text-zinc-400",
  plain: "",
};

export type { Token };
