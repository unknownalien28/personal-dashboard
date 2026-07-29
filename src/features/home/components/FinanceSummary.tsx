import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useFinanceStore } from "@/features/finance/finance-store";
import { computeFinanceSummary } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import { useCountUp } from "@/hooks/useCountUp";

export function FinanceSummary() {
  const { accounts, transactions, bills, savingsGoals } = useFinanceStore();

  const { summary, upcomingBills, savingsPct } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bills
      .filter((b) => !b.archived && !b.paid && b.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);

    const activeGoals = savingsGoals.filter((g) => !g.archived);
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const pct = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    return { summary: computeFinanceSummary(accounts, transactions), upcomingBills: upcoming, savingsPct: pct };
  }, [accounts, transactions, bills, savingsGoals]);

  const animatedBalance = useCountUp(summary.totalBalance);
  const animatedIncome = useCountUp(summary.monthlyIncome);
  const animatedExpenses = useCountUp(summary.monthlyExpenses);

  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance</CardTitle>
        <Link to="/finance" className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-accent-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate tabular-nums">{formatMoney(animatedBalance)}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Current Balance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate tabular-nums">{formatMoney(animatedIncome)}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">This Month's Income</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-danger shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate tabular-nums">{formatMoney(animatedExpenses)}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">This Month's Expenses</p>
            </div>
          </div>
          {savingsGoals.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-accent-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{savingsPct}%</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Savings Progress</p>
              </div>
            </div>
          )}
        </div>

        {upcomingBills.length > 0 && (
          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> Upcoming Bills
            </p>
            <ul role="list" className="flex flex-col gap-1">
              {upcomingBills.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">{b.name}</span>
                  <span className="shrink-0 ml-2">
                    {formatMoney(b.amount)} · {b.dueDate}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
