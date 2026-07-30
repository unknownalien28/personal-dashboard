/**
 * Small shared helpers for calling external AI provider APIs safely:
 * - retryWithBackoff: retries transient failures (rate limits, 5xx, network
 *   blips) with exponential backoff + jitter, and gives up immediately on
 *   errors that a retry can't fix (bad API key, invalid request, etc).
 * - withTimeout: races a provider call against a timeout so a hung upstream
 *   request can't hang an AlienOS request forever.
 * - isRetryableStatus / extractHttpStatus: best-effort status extraction
 *   that works across the OpenAI, Anthropic, and Google GenAI SDK error
 *   shapes without importing all three SDKs into one file.
 */

export interface RetryOptions {
  /** Total attempts including the first — default 3. */
  maxAttempts?: number;
  /** Base delay in ms before the first retry — default 400ms. */
  baseDelayMs?: number;
  /** Upper bound on the backoff delay — default 4000ms. */
  maxDelayMs?: number;
  signal?: AbortSignal;
}

export function extractHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const anyErr = error as { status?: number; statusCode?: number; response?: { status?: number } };
  return anyErr.status ?? anyErr.statusCode ?? anyErr.response?.status;
}

export function isRetryableStatus(status: number | undefined): boolean {
  if (status === undefined) return true; // network-level errors (no status) are usually transient
  if (status === 429) return true; // rate limited
  if (status >= 500 && status <= 599) return true; // upstream server error
  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * Runs `fn`, retrying on transient failures with exponential backoff.
 * Re-throws immediately on non-retryable errors (4xx other than 429) or
 * once `maxAttempts` is exhausted.
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 400, maxDelayMs = 4000, signal } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = extractHttpStatus(error);
      const retryable = isRetryableStatus(status);
      const isLastAttempt = attempt === maxAttempts;

      if (!retryable || isLastAttempt) {
        throw error;
      }

      const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const jitter = Math.random() * exponential * 0.25;
      await sleep(exponential + jitter, signal);
    }
  }

  // Unreachable, but keeps TypeScript happy about the return type.
  throw lastError;
}

/** Rejects with a timeout error if `promise` doesn't settle within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
