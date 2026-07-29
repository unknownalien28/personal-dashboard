import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInCalendarMonths } from "date-fns";
import type { Account, Budget, SavingsGoal, Transaction } from "@/types/models";

function periodRange(period: Budget["period"], reference = new Date()): { start: Date; end: Date } {
  switch (period) {
    case "weekly":
      return { start: startOfWeek(reference), end: endOfWeek(reference) };
    case "yearly":
      return { start: startOfYear(reference), end: endOfYear(reference) };
    case "monthly":
    default:
      return { start: startOfMonth(reference), end: endOfMonth(reference) };
  }
}

export interface BudgetProgress {
  spent: number;
  remaining: number;
  percentage: number; // uncapped - can exceed 100
  overBudget: boolean;
}

export function computeBudgetProgress(budget: Budget, transactions: Transaction[], reference = new Date()): BudgetProgress {
  const { start, end } = periodRange(budget.period, reference);
  const spent = transactions
    .filter((t) => !t.archived && t.type === "expense" && t.category === budget.category)
    .filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d >= start && d <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = budget.amount - spent;
  const percentage = budget.amount <= 0 ? 0 : Math.round((spent / budget.amount) * 100);

  return { spent, remaining, percentage, overBudget: spent > budget.amount };
}

export interface SavingsEstimate {
  monthsRemaining: number | null; // null when there isn't enough contribution history to estimate
  estimatedCompletionDate: string | null;
}

export function computeSavingsEstimate(goal: SavingsGoal): SavingsEstimate {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return { monthsRemaining: 0, estimatedCompletionDate: null };
  if (goal.contributions.length < 2) return { monthsRemaining: null, estimatedCompletionDate: null };

  const sorted = [...goal.contributions].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date);
  const last = new Date(sorted[sorted.length - 1].date);
  const monthsSpan = Math.max(1, differenceInCalendarMonths(last, first) + 1);
  const totalContributed = sorted.reduce((sum, c) => sum + c.amount, 0);
  const avgPerMonth = totalContributed / monthsSpan;

  if (avgPerMonth <= 0) return { monthsRemaining: null, estimatedCompletionDate: null };

  const monthsRemaining = Math.ceil(remaining / avgPerMonth);
  const completion = new Date();
  completion.setMonth(completion.getMonth() + monthsRemaining);

  return { monthsRemaining, estimatedCompletionDate: completion.toISOString().slice(0, 10) };
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netSavings: number;
}

export function computeFinanceSummary(accounts: Account[], transactions: Transaction[], reference = new Date()): FinanceSummary {
  const totalBalance = accounts.filter((a) => !a.archived).reduce((sum, a) => sum + a.balance, 0);
  const { start, end } = periodRange("monthly", reference);

  const thisMonth = transactions.filter((t) => {
    if (t.archived) return false;
    const d = new Date(t.date + "T00:00:00");
    return d >= start && d <= end;
  });

  const monthlyIncome = thisMonth.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = thisMonth.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  return { totalBalance, monthlyIncome, monthlyExpenses, netSavings: monthlyIncome - monthlyExpenses };
}

export interface CategoryBreakdownEntry {
  category: string;
  total: number;
}

export function computeCategoryBreakdown(transactions: Transaction[], type: "income" | "expense" = "expense"): CategoryBreakdownEntry[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.archived || t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthlyTrendEntry {
  monthKey: string; // "YYYY-MM"
  income: number;
  expenses: number;
}

/** Last N months (default 6) of income/expense totals, oldest first. */
export function computeMonthlyTrends(transactions: Transaction[], months = 6, reference = new Date()): MonthlyTrendEntry[] {
  const results: MonthlyTrendEntry[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    const income = transactions
      .filter((t) => !t.archived && t.type === "income" && t.date.slice(0, 7) === monthKey)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => !t.archived && t.type === "expense" && t.date.slice(0, 7) === monthKey)
      .reduce((sum, t) => sum + t.amount, 0);
    results.push({ monthKey, income, expenses });
  }
  return results;
}
