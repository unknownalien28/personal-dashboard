import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { useFinanceStore, type TransactionInput } from "@/features/finance/finance-store";
import {
  computeFinanceSummary,
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeSavingsEstimate,
} from "@/features/finance/finance-calculations";
import { ok, fail, type ToolResult } from "./types";
import type { Transaction } from "@/types/models";

function activeTransactions(): Transaction[] {
  return useFinanceStore.getState().transactions.filter((t) => !t.archived);
}

export function getTransactions(): ToolResult<Transaction[]> {
  const txns = activeTransactions();
  return ok(`Found ${txns.length} transaction(s).`, txns);
}

/** Full picture: balances, this month's income/expenses, top spending categories, budget health. */
export function analyzeFinance(): ToolResult<{
  summary: ReturnType<typeof computeFinanceSummary>;
  topCategories: ReturnType<typeof computeCategoryBreakdown>;
  budgetWarnings: { category: string; percentage: number; overBudget: boolean }[];
}> {
  const { accounts, transactions, budgets } = useFinanceStore.getState();
  const summary = computeFinanceSummary(accounts, transactions);
  const topCategories = computeCategoryBreakdown(transactions, "expense").slice(0, 5);
  const budgetWarnings = budgets
    .map((b) => ({ category: b.category, ...computeBudgetProgress(b, transactions) }))
    .filter((b) => b.percentage >= 80)
    .map((b) => ({ category: b.category, percentage: b.percentage, overBudget: b.overBudget }));

  return ok(
    `Balance $${summary.totalBalance.toFixed(2)}, spent $${summary.monthlyExpenses.toFixed(2)} this month.`,
    { summary, topCategories, budgetWarnings }
  );
}

/** This week's spending vs. last week's, for "your spending increased X% this week" style insights. */
export function weekOverWeekSpending(): ToolResult<{ thisWeek: number; lastWeek: number; percentChange: number | null }> {
  const now = new Date();
  const txns = activeTransactions().filter((t) => t.type === "expense");
  const thisWeekRange = { start: startOfWeek(now), end: endOfWeek(now) };
  const lastWeekRange = { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };

  const sum = (start: Date, end: Date) =>
    txns
      .filter((t) => {
        const d = new Date(`${t.date}T00:00:00`);
        return d >= start && d <= end;
      })
      .reduce((total, t) => total + t.amount, 0);

  const thisWeek = sum(thisWeekRange.start, thisWeekRange.end);
  const lastWeek = sum(lastWeekRange.start, lastWeekRange.end);
  const percentChange = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

  return ok(`This week: $${thisWeek.toFixed(2)}, last week: $${lastWeek.toFixed(2)}.`, {
    thisWeek,
    lastWeek,
    percentChange,
  });
}

/** Savings goals that are ahead of, on, or behind their estimated pace. */
export function savingsSuggestions(): ToolResult<
  { title: string; progressPercent: number; estimate: ReturnType<typeof computeSavingsEstimate> }[]
> {
  const goals = useFinanceStore.getState().savingsGoals.filter((g) => !g.archived);
  const results = goals.map((g) => ({
    title: g.title,
    progressPercent: g.targetAmount <= 0 ? 0 : Math.round((g.currentAmount / g.targetAmount) * 100),
    estimate: computeSavingsEstimate(g),
  }));
  return ok(`${results.length} savings goal(s) analyzed.`, results);
}

export function createTransaction(input: TransactionInput): ToolResult<{ id: string }> {
  if (!input.accountId) return fail("A transaction needs an account.");
  if (!(input.amount > 0)) return fail("A transaction needs a positive amount.");
  const id = useFinanceStore.getState().createTransaction(input);
  return ok(`Logged a ${input.type} of $${input.amount.toFixed(2)} in ${input.category}.`, { id });
}

export function deleteTransaction(id: string): ToolResult<{ id: string }> {
  const txn = activeTransactions().find((t) => t.id === id);
  if (!txn) return fail(`Couldn't find that transaction.`);
  useFinanceStore.getState().deleteTransaction(id);
  return ok(`Deleted the ${txn.type} of $${txn.amount.toFixed(2)}.`, { id });
}
