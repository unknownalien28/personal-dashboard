const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  issues?: unknown;

  constructor(status: number, message: string, issues?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the Authorization header entirely (login/register/refresh/public endpoints). */
  skipAuth?: boolean;
}

// These are wired up by auth-store.ts at startup to avoid a circular import
// between the store (which needs to call the API) and the client (which
// needs the store's current token + refresh logic).
let getAccessToken: () => string | null = () => null;
let onUnauthorized: () => void = () => undefined;
let refreshPromise: Promise<string | null> | null = null;
let doRefresh: () => Promise<string | null> = async () => null;

export function configureApiClient(hooks: {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
  refresh: () => Promise<string | null>;
}) {
  getAccessToken = hooks.getAccessToken;
  onUnauthorized = hooks.onUnauthorized;
  doRefresh = hooks.refresh;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;
  const token = skipAuth ? null : getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuth && !isRetry) {
    // Single-flight refresh: concurrent 401s all await the same refresh call.
    refreshPromise ??= doRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(path, options, true);
    }
    onUnauthorized();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = (data && typeof data === "object" && "message" in data ? (data as { message: unknown }).message : null) ?? response.statusText;
    const issues = data && typeof data === "object" && "issues" in data ? (data as { issues: unknown }).issues : undefined;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : String(message), issues);
  }

  // Every successful response is wrapped by the backend's TransformInterceptor
  // as `{ success: true, data }` — unwrap it here so callers work with plain data.
  if (data && typeof data === "object" && "success" in data && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

export interface UploadedFileMeta {
  key: string;
  size: number;
  mimeType: string;
  url: string;
}

/**
 * Uploads a file to the existing generic `POST /storage/upload` endpoint
 * (base64 body - see backend/src/storage/storage.controller.ts), reporting
 * progress as it goes. Uses XMLHttpRequest rather than fetch specifically
 * because fetch has no cross-browser-supported upload progress event;
 * XHR's `upload.onprogress` does.
 */
export function uploadFileWithProgress(
  file: File,
  dataBase64: string,
  onProgress: (fraction: number) => void,
  options: { signal?: AbortSignal } = {},
): Promise<UploadedFileMeta> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/storage/upload`);
    xhr.setRequestHeader("Content-Type", "application/json");
    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };

    xhr.onload = () => {
      let data: unknown;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiError(xhr.status, "Upload failed: malformed response from server"));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        const message = data && typeof data === "object" && "message" in data ? String((data as { message: unknown }).message) : xhr.statusText;
        reject(new ApiError(xhr.status, message));
        return;
      }
      const unwrapped = data && typeof data === "object" && "data" in data ? (data as { data: unknown }).data : data;
      resolve(unwrapped as UploadedFileMeta);
    };

    xhr.onerror = () => reject(new ApiError(0, "Upload failed: network error"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));

    if (options.signal) {
      if (options.signal.aborted) {
        xhr.abort();
      } else {
        options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
    }

    xhr.send(JSON.stringify({ filename: file.name, mimeType: file.type || "application/octet-stream", dataBase64 }));
  });
}

/**
 * Consumes a Server-Sent Events endpoint that requires a POST body and
 * bearer auth (so the standard `EventSource` API doesn't apply — it only
 * supports unauthenticated GETs). Used by the AI chat streaming endpoint.
 * Reuses the same single-flight token-refresh logic as `request()` above.
 */
export async function* streamSse<T>(path: string, body: unknown, options: { signal?: AbortSignal } = {}): AsyncGenerator<T> {
  const attempt = async (isRetry: boolean): Promise<Response> => {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (response.status === 401 && !isRetry) {
      refreshPromise ??= doRefresh().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) return attempt(true);
      onUnauthorized();
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new ApiError(response.status, text || response.statusText);
    }

    return response;
  };

  const response = await attempt(false);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      if (dataLines.length === 0) continue;

      try {
        yield JSON.parse(dataLines.join("\n")) as T;
      } catch {
        // Ignore malformed/keep-alive frames rather than aborting the whole stream.
      }
    }
  }
}
