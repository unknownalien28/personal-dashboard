import { localStorageAdapter } from "./localStorageAdapter";
import type { StorageAdapter } from "./types";

/**
 * The active storage backend for the whole app.
 *
 * To migrate to Supabase (or any other backend) later:
 *   1. Create `supabaseAdapter.ts` implementing `StorageAdapter`.
 *   2. Change the line below to import and export it instead.
 * Nothing else in the app needs to change.
 */
export const storageAdapter: StorageAdapter = localStorageAdapter;

export type { StorageAdapter } from "./types";

/** Namespaced key prefix so this app's keys never collide with anything else on the domain. */
export const STORAGE_PREFIX = "dashboard:";
