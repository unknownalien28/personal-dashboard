import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";

/** Every zustand-persisted store key this app currently writes to localStorage. */
const DATA_KEYS = ["tasks", "notes", "calendar", "goals", "profile", "settings", "theme", "weather"] as const;
type DataKey = (typeof DATA_KEYS)[number];

const EXPORT_VERSION = 1;

export interface DashboardExport {
  version: number;
  exportedAt: string;
  data: Partial<Record<DataKey, unknown>>;
}

/** Gathers every store's persisted state into one portable JSON object. */
export async function exportAllData(): Promise<DashboardExport> {
  const data: Partial<Record<DataKey, unknown>> = {};
  for (const key of DATA_KEYS) {
    const raw = await storageAdapter.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        // Skip corrupted entries rather than fail the whole export.
      }
    }
  }
  return { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data };
}

export function downloadExport(exportData: DashboardExport) {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true; importedKeys: DataKey[] } | { ok: false; error: string };

/**
 * Validates and writes an imported export back into storage. Deliberately loose
 * validation (structural, not exhaustive field-by-field) — each store's own zustand
 * `persist` envelope (`{state, version}`) is trusted to be internally consistent
 * since it was produced by this same app's export.
 */
export async function importAllData(raw: unknown): Promise<ImportResult> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "File does not contain a valid dashboard export." };
  }
  const candidate = raw as Partial<DashboardExport>;
  if (typeof candidate.version !== "number" || typeof candidate.data !== "object" || candidate.data === null) {
    return { ok: false, error: "File is missing the expected export structure." };
  }

  const importedKeys: DataKey[] = [];
  for (const key of DATA_KEYS) {
    const value = (candidate.data as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (typeof value !== "object" || value === null) {
      return { ok: false, error: `The "${key}" section of the file is malformed.` };
    }
    await storageAdapter.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    importedKeys.push(key);
  }

  if (importedKeys.length === 0) {
    return { ok: false, error: "File didn't contain any recognized dashboard data." };
  }

  return { ok: true, importedKeys };
}

export async function clearAllData(): Promise<void> {
  for (const key of DATA_KEYS) {
    await storageAdapter.removeItem(`${STORAGE_PREFIX}${key}`);
  }
}

/** Rough storage usage in bytes for this app's namespaced localStorage keys. */
export async function getStorageUsageBytes(): Promise<number> {
  let total = 0;
  for (const key of DATA_KEYS) {
    const raw = await storageAdapter.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw) total += new Blob([raw]).size;
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
