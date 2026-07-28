import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useGoalsStore } from "@/features/goals/goals-store";
import { computeGoalStats } from "@/features/goals/goal-stats";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ percent }: { percent: number }) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
      <circle cx="32" cy="32" r={RADIUS} fill="none" strokeWidth="6" className="stroke-zinc-100 dark:stroke-zinc-800" />
      <circle
        cx="32"
        cy="32"
        r={RADIUS}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        stroke="var(--color-accent-500)"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-zinc-900 dark:fill-zinc-100 text-[13px] font-semibold rotate-90"
        style={{ transformOrigin: "32px 32px" }}
      >
        {percent}%
      </text>
    </svg>
  );
}

export function GoalsSummary() {
  const goals = useGoalsStore((s) => s.goals);

  const { stats, upcoming } = useMemo(() => {
    const active = goals.filter((g) => !g.archived && !g.deletedAt);
    const today = new Date().toISOString().slice(0, 10);
    const upcomingDeadlines = active
      .filter((g) => g.status !== "completed" && g.targetDate && g.targetDate >= today)
      .sort((a, b) => (a.targetDate ?? "").localeCompare(b.targetDate ?? ""))
      .slice(0, 3);
    return { stats: computeGoalStats(goals), upcoming: upcomingDeadlines };
  }, [goals]);

  if (stats.total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{stats.total - stats.completed} active</span>
          <span>{stats.completed} completed</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing percent={stats.overallProgress} />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.overallProgress}% overall progress
            </p>
            <Link to="/goals" className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
              View all goals
            </Link>
          </div>
        </div>

        {upcoming.length > 0 && (
          <ul role="list" className="flex flex-col gap-1.5">
            {upcoming.map((goal) => (
              <li key={goal.id}>
                <Link
                  to="/goals"
                  className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-150"
                >
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{goal.title || "Untitled goal"}</span>
                  <span className="shrink-0">{goal.targetDate}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
