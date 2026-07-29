import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { computeCategoryBreakdown, computeMonthlyTrends, computeBudgetProgress } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import { prefersReducedMotion } from "@/hooks/prefersReducedMotion";
import type { Account, Budget, SavingsGoal, Transaction } from "@/types/models";

interface FinanceAnalyticsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

const PIE_COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#60a5fa", "#a78bfa", "#22c55e", "#f59e0b", "#ef4444"];

function ChartCard({
  title,
  height = 240,
  delay = 0,
  children,
}: {
  title: string;
  height?: number;
  delay?: number;
  children: React.ReactElement;
}) {
  return (
    <Card className="p-4 item-in" style={{ "--stagger-delay": `${delay}ms` } as React.CSSProperties}>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">{title}</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function FinanceAnalyticsView({ accounts, transactions, budgets, savingsGoals }: FinanceAnalyticsViewProps) {
  const active = useMemo(() => transactions.filter((t) => !t.archived), [transactions]);
  const trends = useMemo(() => computeMonthlyTrends(active, 6), [active]);
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(active, "expense").slice(0, 8), [active]);
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const chartAnimation = !prefersReducedMotion();

  const cashFlowData = trends.map((t) => ({ month: t.monthKey.slice(5), net: t.income - t.expenses }));

  const budgetUsageData = budgets.map((b) => {
    const progress = computeBudgetProgress(b, active);
    return { name: b.category, used: Math.min(100, progress.percentage) };
  });

  const savingsProgressData = savingsGoals
    .filter((g) => !g.archived)
    .map((g) => ({ name: g.title, progress: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0 }));

  const hasAnyData = active.length > 0;

  if (!hasAnyData) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-16">
        Add some transactions to see analytics here.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Income vs Expenses (last 6 months)" delay={0}>
        <BarChart data={trends.map((t) => ({ month: t.monthKey.slice(5), Income: t.income, Expenses: t.expenses }))}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatMoney(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out" />
          <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out" animationBegin={80} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Spending by Category" delay={40}>
        {categoryBreakdown.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-400">No expense data yet.</div>
        ) : (
          <PieChart>
            <Pie data={categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={(d: any) => d.category ?? ""} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out">
              {categoryBreakdown.map((entry, i) => (
                <Cell key={entry.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        )}
      </ChartCard>

      <ChartCard title="Monthly Trends" delay={80}>
        <LineChart data={trends.map((t) => ({ month: t.monthKey.slice(5), Income: t.income, Expenses: t.expenses }))}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatMoney(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={chartAnimation} animationDuration={700} animationEasing="ease-out" />
          <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={chartAnimation} animationDuration={700} animationEasing="ease-out" animationBegin={100} />
        </LineChart>
      </ChartCard>

      <ChartCard title="Cash Flow (net, last 6 months)" delay={120}>
        <BarChart data={cashFlowData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatMoney(Number(v))} />
          <Bar dataKey="net" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out">
            {cashFlowData.map((d, i) => (
              <Cell key={i} fill={d.net >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard title="Budget Usage" delay={160}>
        {budgetUsageData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-400">No budgets set up yet.</div>
        ) : (
          <BarChart data={budgetUsageData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => `${v}%`} />
            <Bar dataKey="used" fill="var(--color-accent-500)" radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out" />
          </BarChart>
        )}
      </ChartCard>

      <ChartCard title="Account Balances" delay={200}>
        <BarChart data={activeAccounts.map((a) => ({ name: a.name, balance: a.balance }))}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatMoney(Number(v))} />
          <Bar dataKey="balance" fill="var(--color-accent-500)" radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out" />
        </BarChart>
      </ChartCard>

      <ChartCard title="Savings Progress" delay={240}>
        {savingsProgressData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-400">No savings goals yet.</div>
        ) : (
          <BarChart data={savingsProgressData} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => `${v}%`} />
            <Bar dataKey="progress" fill="#22c55e" radius={[0, 4, 4, 0]} isAnimationActive={chartAnimation} animationDuration={600} animationEasing="ease-out" />
          </BarChart>
        )}
      </ChartCard>
    </div>
  );
}
