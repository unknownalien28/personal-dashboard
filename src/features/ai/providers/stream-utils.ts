/**
 * Reads a fetch Response body as a stream of text chunks, splitting on
 * newlines so callers can parse either SSE ("data: {...}") or
 * newline-delimited JSON (Ollama's format) line by line.
 */
export async function readLines(response: Response, onLine: (line: string) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    text.split("\n").forEach(onLine);
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) onLine(line);
  }
  if (buffer) onLine(buffer);
}

/** Extracts the JSON payload from an SSE "data: ..." line, or null if the line isn't a data line. */
export function parseSseData(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return null;
  return payload;
}

/** Wraps a fetch call's non-2xx response into a readable Error, trying to surface the provider's own message. */
export async function throwForBadResponse(response: Response, providerLabel: string): Promise<never> {
  let detail = "";
  try {
    const body = await response.clone().text();
    const parsed = JSON.parse(body);
    detail = parsed?.error?.message || parsed?.message || body.slice(0, 200);
  } catch {
    // response wasn't JSON, or already consumed - fall through with no extra detail
  }
  throw new Error(`${providerLabel} request failed (${response.status})${detail ? `: ${detail}` : ""}`);
}
