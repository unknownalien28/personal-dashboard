import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storageAdapter, STORAGE_PREFIX } from "@/lib/storage";
import type {
  Account,
  AccountType,
  Bill,
  Budget,
  BudgetPeriod,
  NoteColor,
  ReminderOption,
  RepeatOption,
  SavingsGoal,
  Transaction,
  TransactionType,
} from "@/types/models";

export interface AccountInput {
  name: string;
  type: AccountType;
  color: NoteColor;
  icon: string;
  currency: string;
  openingBalance: number;
  notes: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  accountId: string;
  transferToAccountId: string | null;
  date: string;
  time: string | null;
  notes: string;
  tags: string[];
  hasReceipt: boolean;
  recurring: boolean;
  favorite: boolean;
}

export interface BudgetInput {
  category: string;
  amount: number;
  period: BudgetPeriod;
}

export interface BillInput {
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  reminder: ReminderOption;
  autoRepeat: RepeatOption;
}

export interface SavingsGoalInput {
  title: string;
  targetAmount: number;
  deadline: string | null;
  color: NoteColor;
  icon: string;
}

/** Applies (sign=1) or reverses (sign=-1) a transaction's effect on account balances. */
function applyTransactionEffect(accounts: Account[], txn: Pick<Transaction, "type" | "amount" | "accountId" | "transferToAccountId">, sign: 1 | -1): Account[] {
  return accounts.map((acc) => {
    if (txn.type === "income" && acc.id === txn.accountId) {
      return { ...acc, balance: acc.balance + sign * txn.amount };
    }
    if (txn.type === "expense" && acc.id === txn.accountId) {
      return { ...acc, balance: acc.balance - sign * txn.amount };
    }
    if (txn.type === "transfer") {
      if (acc.id === txn.accountId) return { ...acc, balance: acc.balance - sign * txn.amount };
      if (txn.transferToAccountId && acc.id === txn.transferToAccountId) {
        return { ...acc, balance: acc.balance + sign * txn.amount };
      }
    }
    return acc;
  });
}

function advanceDueDate(dueDate: string, repeat: RepeatOption): string {
  const d = new Date(dueDate + "T00:00:00");
  switch (repeat) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().slice(0, 10);
}

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  customCategories: string[];

  createAccount: (input: AccountInput) => string;
  updateAccount: (id: string, updates: Partial<AccountInput>) => void;
  archiveAccount: (id: string) => void;
  unarchiveAccount: (id: string) => void;
  deleteAccount: (id: string) => { ok: boolean; error?: string };

  createTransaction: (input: TransactionInput) => string;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => string | null;
  archiveTransaction: (id: string) => void;
  unarchiveTransaction: (id: string) => void;
  toggleFavorite: (id: string) => void;

  createBudget: (input: BudgetInput) => string;
  updateBudget: (id: string, updates: Partial<BudgetInput>) => void;
  deleteBudget: (id: string) => void;

  createBill: (input: BillInput) => string;
  updateBill: (id: string, updates: Partial<BillInput>) => void;
  deleteBill: (id: string) => void;
  archiveBill: (id: string) => void;
  unarchiveBill: (id: string) => void;
  markBillPaid: (id: string) => void;

  createSavingsGoal: (input: SavingsGoalInput) => string;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoalInput>) => void;
  deleteSavingsGoal: (id: string) => void;
  archiveSavingsGoal: (id: string) => void;
  unarchiveSavingsGoal: (id: string) => void;
  contributeToSavingsGoal: (goalId: string, amount: number, fromAccountId: string) => void;

  addCustomCategory: (name: string) => void;
}

const now = () => new Date().toISOString();

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      accounts: [],
      transactions: [],
      budgets: [],
      bills: [],
      savingsGoals: [],
      customCategories: [],

      createAccount: (input) => {
        const timestamp = now();
        const account: Account = {
          ...input,
          id: crypto.randomUUID(),
          balance: input.openingBalance,
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return account.id;
      },

      updateAccount: (id, updates) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: now() } : a)),
        })),

      archiveAccount: (id) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, archived: true, updatedAt: now() } : a)) })),

      unarchiveAccount: (id) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, archived: false, updatedAt: now() } : a)) })),

      deleteAccount: (id) => {
        const hasTransactions = get().transactions.some((t) => t.accountId === id || t.transferToAccountId === id);
        if (hasTransactions) {
          return { ok: false, error: "This account has transaction history. Archive it instead of deleting." };
        }
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
        return { ok: true };
      },

      createTransaction: (input) => {
        const timestamp = now();
        const txn: Transaction = {
          ...input,
          id: crypto.randomUUID(),
          hasReceipt: input.hasReceipt,
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((s) => ({
          transactions: [...s.transactions, txn],
          accounts: applyTransactionEffect(s.accounts, txn, 1),
        }));
        return txn.id;
      },

      updateTransaction: (id, input) =>
        set((s) => {
          const old = s.transactions.find((t) => t.id === id);
          if (!old) return s;
          const updated: Transaction = { ...old, ...input, updatedAt: now() };
          const accountsReverted = applyTransactionEffect(s.accounts, old, -1);
          const accountsApplied = applyTransactionEffect(accountsReverted, updated, 1);
          return {
            transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
            accounts: accountsApplied,
          };
        }),

      deleteTransaction: (id) =>
        set((s) => {
          const txn = s.transactions.find((t) => t.id === id);
          if (!txn) return s;
          return {
            transactions: s.transactions.filter((t) => t.id !== id),
            accounts: applyTransactionEffect(s.accounts, txn, -1),
          };
        }),

      duplicateTransaction: (id) => {
        const original = get().transactions.find((t) => t.id === id);
        if (!original) return null;
        const timestamp = now();
        const copy: Transaction = {
          ...original,
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          favorite: false,
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((s) => ({
          transactions: [...s.transactions, copy],
          accounts: applyTransactionEffect(s.accounts, copy, 1),
        }));
        return copy.id;
      },

      // Archiving only hides a transaction from active views/reports — the money still
      // moved, so account balances are intentionally left untouched here.
      archiveTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, archived: true, updatedAt: now() } : t)) })),

      unarchiveTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, archived: false, updatedAt: now() } : t)) })),

      toggleFavorite: (id) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)) })),

      createBudget: (input) => {
        const timestamp = now();
        const budget: Budget = { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
        set((s) => ({ budgets: [...s.budgets, budget] }));
        return budget.id;
      },

      updateBudget: (id, updates) =>
        set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: now() } : b)) })),

      deleteBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      createBill: (input) => {
        const timestamp = now();
        const bill: Bill = { ...input, id: crypto.randomUUID(), paid: false, archived: false, createdAt: timestamp, updatedAt: timestamp };
        set((s) => ({ bills: [...s.bills, bill] }));
        return bill.id;
      },

      updateBill: (id, updates) =>
        set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: now() } : b)) })),

      deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      archiveBill: (id) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, archived: true, updatedAt: now() } : b)) })),

      unarchiveBill: (id) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, archived: false, updatedAt: now() } : b)) })),

      markBillPaid: (id) =>
        set((s) => ({
          bills: s.bills.map((b) => {
            if (b.id !== id) return b;
            if (b.autoRepeat !== "none") {
              return { ...b, paid: false, dueDate: advanceDueDate(b.dueDate, b.autoRepeat), updatedAt: now() };
            }
            return { ...b, paid: true, updatedAt: now() };
          }),
        })),

      createSavingsGoal: (input) => {
        const timestamp = now();
        const goal: SavingsGoal = {
          ...input,
          id: crypto.randomUUID(),
          currentAmount: 0,
          contributions: [],
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((s) => ({ savingsGoals: [...s.savingsGoals, goal] }));
        return goal.id;
      },

      updateSavingsGoal: (id, updates) =>
        set((s) => ({ savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: now() } : g)) })),

      deleteSavingsGoal: (id) => set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) })),

      archiveSavingsGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, archived: true, updatedAt: now() } : g)) })),

      unarchiveSavingsGoal: (id) =>
        set((s) => ({ savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, archived: false, updatedAt: now() } : g)) })),

      // Contributing is a real transfer out of a real account into the goal "envelope" —
      // it deducts from the chosen account (via a genuine expense transaction) and
      // credits the goal, so Total Balance stays accurate.
      contributeToSavingsGoal: (goalId, amount, fromAccountId) => {
        const goal = get().savingsGoals.find((g) => g.id === goalId);
        if (!goal || amount <= 0) return;
        const timestamp = now();
        const txn: Transaction = {
          id: crypto.randomUUID(),
          type: "expense",
          amount,
          category: "Savings",
          accountId: fromAccountId,
          transferToAccountId: null,
          date: new Date().toISOString().slice(0, 10),
          time: null,
          notes: `Contribution to "${goal.title}"`,
          tags: [],
          hasReceipt: false,
          recurring: false,
          favorite: false,
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((s) => ({
          transactions: [...s.transactions, txn],
          accounts: applyTransactionEffect(s.accounts, txn, 1),
          savingsGoals: s.savingsGoals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  currentAmount: g.currentAmount + amount,
                  contributions: [...g.contributions, { id: crypto.randomUUID(), amount, date: timestamp }],
                  updatedAt: timestamp,
                }
              : g
          ),
        }));
      },

      addCustomCategory: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed || s.customCategories.includes(trimmed)) return s;
          return { customCategories: [...s.customCategories, trimmed] };
        }),
    }),
    {
      name: `${STORAGE_PREFIX}finance`,
      storage: createJSONStorage(() => storageAdapter),
    }
  )
);
