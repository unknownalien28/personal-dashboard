import { useMemo } from "react";
import { CalendarClock, FileEdit, CheckCircle2, Lightbulb, Flame, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useCountUp } from "@/hooks/useCountUp";
import {
  computeContentCounts,
  computePostingStreak,
  computePostingConsistency,
  upcomingPosts,
} from "@/features/content/content-calculations";
import { platformConfig } from "@/features/content/platforms";
import type { ContentPost } from "@/types/models";

function StatCard({ icon: Icon, label, value }: { icon: typeof CalendarClock; label: string; value: number }) {
  const animated = useCountUp(value);
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-accent-500" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-tight tabular-nums text-zinc-900 dark:text-zinc-100">{animated}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{label}</div>
      </div>
    </Card>
  );
}

interface ContentDashboardViewProps {
  posts: ContentPost[];
  onOpenPost: (id: string) => void;
  onNavigate: (view: "calendar" | "ideas" | "analytics") => void;
}

export function ContentDashboardView({ posts, onOpenPost, onNavigate }: ContentDashboardViewProps) {
  const counts = useMemo(() => computeContentCounts(posts), [posts]);
  const streak = useMemo(() => computePostingStreak(posts), [posts]);
  const consistency = useMemo(() => computePostingConsistency(posts), [posts]);
  const upcoming = useMemo(() => upcomingPosts(posts, 6), [posts]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={CalendarClock} label="Scheduled Posts" value={counts.scheduled} />
        <StatCard icon={FileEdit} label="Drafts" value={counts.drafts} />
        <StatCard icon={CheckCircle2} label="Published" value={counts.published} />
        <StatCard icon={Lightbulb} label="Content Ideas" value={counts.ideas} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col gap-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Posting Streak</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{consistency}% of the last 30 days had a published post</p>
        </Card>

        <Card className="p-4 flex flex-col gap-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upcoming Posts</span>
            <button type="button" className="text-xs text-accent-500 hover:text-accent-600" onClick={() => onNavigate("calendar")}>
              View calendar
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Nothing scheduled yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {upcoming.map((p) => {
                const platform = platformConfig[p.platform];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPost(p.id)}
                    className="flex items-center gap-2 text-left rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <platform.icon className="h-3.5 w-3.5 shrink-0" style={{ color: platform.colorVar }} />
                    <span className="text-sm text-zinc-700 dark:text-zinc-200 truncate flex-1">{p.title}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">{p.publishDate}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4 flex flex-col gap-2">
        <button type="button" onClick={() => onNavigate("analytics")} className="flex items-center gap-2 text-left">
          <BarChart3 className="h-4 w-4 text-accent-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Analytics Overview</span>
          <Badge tone="neutral">Placeholder</Badge>
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Local counts and platform distribution are available now - engagement metrics arrive once real platform integrations are
          connected.
        </p>
      </Card>
    </div>
  );
}
