import type { StorageAdapter } from "./types";

/**
 * Default storage backend for local development and early deployments.
 * Wrapped in try/catch because localStorage can throw in private-browsing
 * modes or when storage quota is exceeded — the app should degrade
 * gracefully (data just won't persist) rather than crash.
 */
export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable — fail silently rather than crash the app.
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
};
