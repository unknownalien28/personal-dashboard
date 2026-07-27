/**
 * StorageAdapter is the single contract every persistence backend must satisfy.
 *
 * Today, `localStorageAdapter` implements this using the browser's localStorage.
 * Later, a `supabaseAdapter` (or any other backend) can implement the exact same
 * shape, and swapping it in `index.ts` is the only change required anywhere
 * in the app — no feature code, no components, no stores need to change.
 *
 * The shape intentionally matches Zustand's `StateStorage` interface
 * (getItem/setItem/removeItem, string in and out) so any adapter here can be
 * passed directly into a Zustand `persist` middleware.
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
