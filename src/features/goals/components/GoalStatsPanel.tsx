import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";
import { computeGoalStats } from "@/features/goals/goal-stats";
import { goalStatusConfig } from "@/features/goals/goal-status-config";
import type { Goal } from "@/types/models";

interface GoalStatsPanelProps {
  goals: Goal[];
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
    </Card>
  );
}

function GoalStatsPanelBase({ goals }: GoalStatsPanelProps) {
  const stats = computeGoalStats(goals);

  const statusData = (Object.keys(stats.statusBreakdown) as (keyof typeof stats.statusBreakdown)[]).map((key) => ({
    name: goalStatusConfig[key].label,
    count: stats.statusBreakdown[key],
  }));

  if (stats.total === 0) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-16">
        Create some goals to see statistics here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBlock label="Completion rate" value={`${stats.completionRate}%`} />
        <StatBlock label="Overall progress" value={`${stats.overallProgress}%`} />
        <StatBlock label="Completed this month" value={stats.completedThisMonth} />
        <StatBlock label="Completed this year" value={stats.completedThisYear} />
        <StatBlock label="Overdue goals" value={stats.overdue} />
        <StatBlock label="Completion streak" value={`${stats.completionStreakMonths}mo`} />
        <StatBlock label="Active goals" value={stats.total} />
        <StatBlock label="Completed goals" value={stats.completed} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Goals by status</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-400" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" className="text-zinc-400" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                wrapperClassName="!bg-[var(--color-surface)]"
              />
              <Bar dataKey="count" fill="var(--color-accent-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Category breakdown</h3>
        <div className="flex flex-col gap-2.5">
          {stats.categoryBreakdown.map((c) => (
            <div key={c.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {c.category} <span className="text-zinc-400 dark:text-zinc-500">({c.count})</span>
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">{c.avgProgress}% avg</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${c.avgProgress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export const GoalStatsPanel = memo(GoalStatsPanelBase);
