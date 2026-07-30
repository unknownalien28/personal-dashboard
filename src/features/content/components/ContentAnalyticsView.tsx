import { useMemo } from "react";
import type { ReactElement } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import {
  computeContentCounts,
  computePlatformDistribution,
  computeCategoryDistribution,
  computePostingConsistency,
} from "@/features/content/content-calculations";
import { platformConfig } from "@/features/content/platforms";
import { prefersReducedMotion } from "@/hooks/prefersReducedMotion";
import type { ContentPost } from "@/types/models";

const PIE_COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#60a5fa", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#eab308"];

function ChartCard({ title, height = 240, children }: { title: string; height?: number; children: ReactElement }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[var(--color-border)] px-3 py-2">
      <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

export function ContentAnalyticsView({ posts }: { posts: ContentPost[] }) {
  const counts = useMemo(() => computeContentCounts(posts), [posts]);
  const platformData = useMemo(
    () => computePlatformDistribution(posts).map((p) => ({ name: platformConfig[p.platform].label, value: p.count })),
    [posts]
  );
  const categoryData = useMemo(() => computeCategoryDistribution(posts).map((c) => ({ name: c.category, count: c.count })), [posts]);
  const consistency = useMemo(() => computePostingConsistency(posts), [posts]);
  const reducedMotion = prefersReducedMotion();

  if (posts.length === 0) {
    return <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-16">Add some content to see analytics here.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatPill label="Total Posts" value={counts.total} />
        <StatPill label="Scheduled" value={counts.scheduled} />
        <StatPill label="Published" value={counts.published} />
        <StatPill label="Drafts" value={counts.drafts} />
        <StatPill label="Ideas" value={counts.ideas} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Platform Distribution">
          <PieChart>
            <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} isAnimationActive={!reducedMotion}>
              {platformData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>

        <ChartCard title="Content Categories">
          <BarChart data={categoryData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-accent-500)" radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion} />
          </BarChart>
        </ChartCard>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Posting Consistency</h3>
        <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-accent-500 rounded-full transition-[width]" style={{ width: `${consistency}%` }} />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">{consistency}% of the last 30 days had at least one published post.</p>
      </Card>
    </div>
  );
}
