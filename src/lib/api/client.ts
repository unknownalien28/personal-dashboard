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
