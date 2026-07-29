import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { computeFinanceSummary, computeBudgetProgress } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import { getSavingsIcon } from "@/features/finance/savings-icons";
import { financeColorConfig } from "@/features/finance/finance-color-config";
import { useCountUp } from "@/hooks/useCountUp";
import type { Account, Bill, Budget, SavingsGoal, Transaction } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface FinanceDashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  onOpenTransaction: (id: string) => void;
  onNavigate: (view: "budgets" | "bills" | "savings" | "transactions") => void;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: number; tone?: string }) {
  const animated = useCountUp(value);
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-accent-500" />
      </div>
      <div className="min-w-0">
        <div className={cn("text-lg font-semibold leading-tight truncate tabular-nums", tone ?? "text-zinc-900 dark:text-zinc-100")}>
          {formatMoney(animated)}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{label}</div>
      </div>
    </Card>
  );
}

export function FinanceDashboardView({
  accounts,
  transactions,
  budgets,
  bills,
  savingsGoals,
  onOpenTransaction,
  onNavigate,
}: FinanceDashboardViewProps) {
  const summary = useMemo(() => computeFinanceSummary(accounts, transactions), [accounts, transactions]);

  const activeTransactions = useMemo(() => transactions.filter((t) => !t.archived), [transactions]);
  const recentTransactions = useMemo(
    () => [...activeTransactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [activeTransactions]
  );

  const upcomingBills = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return bills
      .filter((b) => !b.archived && !b.paid && b.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);
  }, [bills]);

  const activeSavingsGoals = useMemo(() => savingsGoals.filter((g) => !g.archived).slice(0, 4), [savingsGoals]);
  const activeBudgets = useMemo(() => budgets.slice(0, 4), [budgets]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="Total Balance" value={summary.totalBalance} />
        <StatCard icon={TrendingUp} label="This Month's Income" value={summary.monthlyIncome} tone="text-success" />
        <StatCard icon={TrendingDown} label="This Month's Expenses" value={summary.monthlyExpenses} tone="text-danger" />
        <StatCard
          icon={PiggyBank}
          label="Net Savings"
          value={summary.netSavings}
          tone={summary.netSavings >= 0 ? "text-success" : "text-danger"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Budget Progress</h3>
            <button onClick={() => onNavigate("budgets")} className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
              View all
            </button>
          </div>
          {activeBudgets.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">No budgets set up yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeBudgets.map((b) => {
                const progress = computeBudgetProgress(b, transactions);
                const pct = Math.min(100, Math.max(0, progress.percentage));
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.category}</span>
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {formatMoney(progress.spent)} / {formatMoney(b.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-[width] duration-300 ease-out", progress.overBudget ? "bg-danger" : "bg-accent-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upcoming Bills</h3>
            <button onClick={() => onNavigate("bills")} className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
              View all
            </button>
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">No upcoming bills.</p>
          ) : (
            <ul role="list" className="flex flex-col gap-2">
              {upcomingBills.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">{b.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{b.dueDate}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">{formatMoney(b.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Savings Goals</h3>
            <button onClick={() => onNavigate("savings")} className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
              View all
            </button>
          </div>
          {activeSavingsGoals.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">No savings goals yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeSavingsGoals.map((g) => {
                const Icon = getSavingsIcon(g.icon);
                const pct = g.targetAmount <= 0 ? 0 : Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", financeColorConfig[g.color].ringClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{g.title}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 shrink-0 ml-2">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Transactions</h3>
            <button onClick={() => onNavigate("transactions")} className="text-xs text-accent-600 dark:text-accent-400 hover:underline">
              View all
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">No transactions yet.</p>
          ) : (
            <ul role="list" className="flex flex-col gap-2">
              {recentTransactions.map((t) => (
                <li key={t.id}>
                  <button onClick={() => onOpenTransaction(t.id)} className="flex items-center justify-between w-full text-sm text-left">
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{t.category}</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums shrink-0 ml-2",
                        t.type === "income" ? "text-success" : t.type === "expense" ? "text-danger" : "text-accent-500"
                      )}
                    >
                      {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}
                      {formatMoney(t.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
