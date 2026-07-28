import { useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { useSettingsStore } from "@/features/profile/settings-store";
import {
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
} from "@/features/calendar/reminders";

const toggles: { key: "calendarReminders" | "goalReminders" | "taskReminders"; label: string; description: string }[] = [
  { key: "calendarReminders", label: "Calendar reminders", description: "Notify me before events start" },
  { key: "goalReminders", label: "Goal reminders", description: "Notify me about upcoming goal deadlines" },
  { key: "taskReminders", label: "Task reminders", description: "Notify me about tasks due soon" },
];

export function NotificationsSection() {
  const { notifications, updateNotifications } = useSettingsStore();
  const [permission, setPermission] = useState(getNotificationPermission());

  async function handleEnable() {
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="rounded-lg border border-[var(--color-border)] p-4 flex items-start gap-3">
        {permission === "granted" ? (
          <BellRing className="h-5 w-5 text-accent-500 shrink-0 mt-0.5" />
        ) : (
          <BellOff className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {!isNotificationSupported()
              ? "Browser notifications aren't supported here"
              : permission === "granted"
                ? "Browser notifications are enabled"
                : permission === "denied"
                  ? "Browser notifications are blocked"
                  : "Browser notifications aren't enabled yet"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {permission === "denied"
              ? "You've blocked notifications for this site — re-enable them in your browser's site settings."
              : "Reminders only fire while this tab is open, since there's no server to schedule background push notifications."}
          </p>
          {isNotificationSupported() && permission === "default" && (
            <button
              onClick={handleEnable}
              className="mt-2 text-xs font-medium text-accent-600 dark:text-accent-400 hover:underline"
            >
              Enable notifications
            </button>
          )}
        </div>
      </div>

      {toggles.map((t) => (
        <label key={t.key} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 h-14">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.label}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.description}</p>
          </div>
          <input
            type="checkbox"
            checked={notifications[t.key]}
            onChange={(e) => updateNotifications({ [t.key]: e.target.checked })}
            className="h-5 w-5 rounded accent-accent-500"
          />
        </label>
      ))}
    </div>
  );
}
