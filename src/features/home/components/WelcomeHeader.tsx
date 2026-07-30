import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useProfileStore } from "@/features/profile/profile-store";
import { Avatar } from "@/components/ui/Avatar";

function getGreeting(hour: number) {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Evening";
}

function getProductivityMessage(hour: number) {
  if (hour < 12) return "Let's start the day strong.";
  if (hour < 17) return "Keep the momentum going.";
  return "Take a moment to review today's progress.";
}

export function WelcomeHeader() {
  const { name, avatarColor, avatarDataUrl } = useProfileStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Use just the first name when one is parseable; fall back to the full display name otherwise.
  const firstName = name.trim().split(/\s+/)[0] || name;

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
      <div className="flex items-center gap-3">
        <Avatar name={name} color={avatarColor} dataUrl={avatarDataUrl} />
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {getGreeting(now.getHours())}, {firstName} <span aria-hidden="true">👋</span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{dateLabel}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{getProductivityMessage(now.getHours())}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{timeLabel}</div>
        <Link
          to="/profile"
          aria-label="Quick settings"
          className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-150"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </div>
  );
}
