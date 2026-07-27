import { useEffect, useState } from "react";
import { useProfileStore } from "@/features/profile/profile-store";

function getGreeting(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

export function WelcomeHeader() {
  const name = useProfileStore((s) => s.name);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {getGreeting(now.getHours())}, {name}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{dateLabel}</p>
      </div>
      <div className="text-3xl font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
        {timeLabel}
      </div>
    </div>
  );
}
