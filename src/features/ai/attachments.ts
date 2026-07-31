import { uploadFileWithProgress, type UploadedFileMeta } from "@/lib/api/client";
import type { ChatAttachment } from "@/types/models";

/** Matches the backend's own limit (storage.controller.ts MAX_UPLOAD_BYTES) so the user gets fast client-side feedback instead of waiting for a round trip to fail. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_FILES_PER_MESSAGE = 5;
/** Files at or under this size, and of a text-like type, get their content read and inlined into what's actually sent to the AI. Larger text files are still uploaded/stored and referenced by link, just not inlined (keeps prompts bounded). */
export const MAX_INLINE_TEXT_BYTES = 50 * 1024; // 50KB

const TEXT_LIKE_MIME_PREFIXES = ["text/"];
const TEXT_LIKE_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/x-yaml",
  "application/yaml",
  "application/csv",
]);
const TEXT_LIKE_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "yaml",
  "yml",
  "xml",
  "log",
  "ts",
  "tsx",
  "js",
  "jsx",
  "css",
  "html",
  "py",
  "java",
  "go",
  "rs",
  "c",
  "cpp",
  "h",
  "sh",
]);

export function isTextLikeFile(file: File): boolean {
  if (TEXT_LIKE_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return true;
  if (TEXT_LIKE_MIME_TYPES.has(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return !!ext && TEXT_LIKE_EXTENSIONS.has(ext);
}

/** Whether this specific file's content should be read and inlined into the AI's context, vs just uploaded and referenced by link. Pure function so it's covered by validateFiles' tests without needing to mock a real upload. */
export function shouldInlineContent(file: File): boolean {
  return isTextLikeFile(file) && file.size <= MAX_INLINE_TEXT_BYTES;
}

export interface FileValidationError {
  file: File;
  reason: string;
}

/** Client-side pre-check so the user gets immediate feedback instead of waiting on a round trip that the backend will reject anyway (which still separately enforces its own limit - this is a UX fast-path, not the source of truth). */
export function validateFiles(files: File[], alreadyStagedCount: number): { valid: File[]; errors: FileValidationError[] } {
  const valid: File[] = [];
  const errors: FileValidationError[] = [];
  let remainingSlots = MAX_FILES_PER_MESSAGE - alreadyStagedCount;

  for (const file of files) {
    if (remainingSlots <= 0) {
      errors.push({ file, reason: `Only up to ${MAX_FILES_PER_MESSAGE} files per message are supported.` });
      continue;
    }
    if (file.size === 0) {
      errors.push({ file, reason: "File is empty." });
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push({ file, reason: `File exceeds the ${MAX_FILE_BYTES / (1024 * 1024)}MB limit.` });
      continue;
    }
    valid.push(file);
    remainingSlots -= 1;
  }

  return { valid, errors };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:<mime>;base64,<data>" - strip the prefix, we send raw base64.
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
    reader.readAsText(file);
  });
}

export interface StagedUpload {
  file: File;
  meta: UploadedFileMeta;
  attachment: ChatAttachment;
  /** The actual text content to inline into the outgoing message, if shouldInlineContent(file) was true. */
  inlineContent?: string;
}

/**
 * Uploads one file to the existing generic storage endpoint and, for
 * small text-like files, also reads its text content for inlining into
 * the AI's context. Both happen regardless of order (Promise.all) since
 * they're independent reads of the same File object.
 */
export async function uploadAttachment(
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<StagedUpload> {
  const wantsInline = shouldInlineContent(file);
  const [meta, inlineContent] = await Promise.all([
    readFileAsBase64(file).then((b64) => uploadFileWithProgress(file, b64, onProgress, { signal })),
    wantsInline ? readFileAsText(file) : Promise.resolve(undefined),
  ]);

  const attachment: ChatAttachment = {
    filename: file.name,
    mimeType: meta.mimeType,
    size: meta.size,
    url: meta.url,
    contentIncluded: wantsInline,
  };

  return { file, meta, attachment, inlineContent };
}

/**
 * Builds the text actually sent to the AI: the user's typed message plus a
 * clearly-delimited block per attached file. Text-like files under the
 * inline cap get their real content inlined so the model can read/quote/
 * summarize them directly; anything else (images, PDFs, large files) is
 * referenced by name/type/size/link only - the model can acknowledge it
 * exists and point the person to it, but genuine multimodal file
 * understanding (e.g. actually looking at an image) is out of scope here
 * and would need per-provider vision wiring, not just prompt text.
 */
export function buildMessageWithAttachments(userText: string, uploads: StagedUpload[]): string {
  if (uploads.length === 0) return userText;

  const blocks = uploads.map(({ attachment, inlineContent }) => {
    if (inlineContent !== undefined) {
      return `--- Attached file: ${attachment.filename} (${attachment.mimeType}) ---\n${inlineContent}\n--- end file ---`;
    }
    return `[Attached file: ${attachment.filename}, ${attachment.mimeType}, ${formatBytes(attachment.size)} - not a text file, content not included, available at ${attachment.url}]`;
  });

  return [userText, ...blocks].filter(Boolean).join("\n\n");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ATTACHMENT_BLOCK_MARKER = /\n\n(?:--- Attached file:|\[Attached file:)/;

/**
 * The inverse of buildMessageWithAttachments: given a message's full stored
 * content (which includes the inlined file blocks - stored as-is so
 * retry/regenerate re-send the same file content, not just the typed text),
 * returns just the human-typed portion for display in the chat bubble.
 * Attachment chips (rendered separately from ChatMessage.attachments) are
 * how the person sees which files were attached, not this raw text dump.
 */
export function stripAttachmentBlocks(content: string): string {
  const match = content.match(ATTACHMENT_BLOCK_MARKER);
  return match ? content.slice(0, match.index).trimEnd() : content;
}
