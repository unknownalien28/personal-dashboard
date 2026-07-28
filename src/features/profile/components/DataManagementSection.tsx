import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2, RotateCcw, HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSettingsStore } from "@/features/profile/settings-store";
import {
  exportAllData,
  downloadExport,
  importAllData,
  clearAllData,
  getStorageUsageBytes,
  formatBytes,
} from "@/features/profile/export-import";

type Notice = { type: "success" | "error"; message: string } | null;

export function DataManagementSection() {
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [usageBytes, setUsageBytes] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getStorageUsageBytes().then(setUsageBytes);
  }, [notice]);

  async function handleExport() {
    const data = await exportAllData();
    downloadExport(data);
    setNotice({ type: "success", message: "Export downloaded." });
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importAllData(parsed);
      if (result.ok) {
        setNotice({ type: "success", message: `Imported: ${result.importedKeys.join(", ")}. Reloading...` });
        setTimeout(() => window.location.reload(), 900);
      } else {
        setNotice({ type: "error", message: result.error });
      }
    } catch {
      setNotice({ type: "error", message: "That file isn't valid JSON." });
    }
  }

  async function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await clearAllData();
    setNotice({ type: "success", message: "All local data cleared. Reloading..." });
    setTimeout(() => window.location.reload(), 900);
  }

  function handleResetSettings() {
    resetSettings();
    setNotice({ type: "success", message: "Settings reset to defaults." });
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {notice && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            notice.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      <div className="rounded-lg border border-[var(--color-border)] p-4 flex items-center gap-3">
        <HardDrive className="h-5 w-5 text-zinc-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Storage used</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {usageBytes === null ? "Calculating..." : formatBytes(usageBytes)} across all dashboard data
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Export data</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Download everything — tasks, notes, calendar, goals, and settings — as one JSON file.
        </p>
        <Button variant="secondary" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export all data
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Import data</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Restore from a previously exported JSON file. This overwrites current data for any section the file includes.
        </p>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" /> Import from file
        </Button>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Reset settings</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Restores appearance, notifications, and preferences to their defaults. Your tasks, notes, calendar, and goals are untouched.
        </p>
        <Button variant="secondary" onClick={handleResetSettings}>
          <RotateCcw className="h-4 w-4" /> Reset settings
        </Button>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <h3 className="text-sm font-medium text-danger mb-2">Clear all local data</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Permanently deletes every task, note, event, goal, and setting stored in this browser. This can't be undone —
          export a backup first if you're not sure.
        </p>
        <Button variant={confirmClear ? "danger" : "secondary"} onClick={handleClearAll}>
          <Trash2 className="h-4 w-4" /> {confirmClear ? "Click again to confirm" : "Clear all local data"}
        </Button>
        {confirmClear && (
          <button
            onClick={() => setConfirmClear(false)}
            className="ml-2 text-xs text-zinc-500 dark:text-zinc-400 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
