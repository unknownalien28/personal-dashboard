import { useMemo, useRef, useState, lazy, Suspense } from "react";
import { Plus, Download, Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { useFinanceStore } from "@/features/finance/finance-store";
import { defaultFinanceCategories } from "@/features/finance/categories";
import { computeFinanceSummary } from "@/features/finance/finance-calculations";
import { formatMoney } from "@/features/finance/format-money";
import { transactionsToCsv, downloadCsv } from "@/features/finance/csv-export";
import { FinanceSidebar, type FinanceView, type TransactionTypeFilter } from "@/features/finance/components/FinanceSidebar";
import { FinanceDashboardView } from "@/features/finance/components/FinanceDashboardView";
import { AccountCard } from "@/features/finance/components/AccountCard";
import { AccountForm } from "@/features/finance/components/AccountForm";
import { TransactionRow } from "@/features/finance/components/TransactionRow";
import { TransactionForm } from "@/features/finance/components/TransactionForm";
import { BudgetCard } from "@/features/finance/components/BudgetCard";
import { BudgetForm } from "@/features/finance/components/BudgetForm";
import { BillRow } from "@/features/finance/components/BillRow";
import { BillForm } from "@/features/finance/components/BillForm";
import { SavingsGoalCard } from "@/features/finance/components/SavingsGoalCard";
import { SavingsGoalForm } from "@/features/finance/components/SavingsGoalForm";

const FinanceAnalyticsView = lazy(() =>
  import("@/features/finance/components/FinanceAnalyticsView").then((m) => ({ default: m.FinanceAnalyticsView }))
);

type EntityType = "account" | "transaction" | "budget" | "bill" | "savings";
type ModalState = { type: EntityType; id: string | null } | null;

export function FinancePage() {
  const {
    accounts,
    transactions,
    budgets,
    bills,
    savingsGoals,
    customCategories,
    createAccount,
    updateAccount,
    archiveAccount,
    unarchiveAccount,
    deleteAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
    archiveTransaction,
    unarchiveTransaction,
    createBudget,
    updateBudget,
    deleteBudget,
    createBill,
    updateBill,
    deleteBill,
    archiveBill,
    unarchiveBill,
    markBillPaid,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    archiveSavingsGoal,
    unarchiveSavingsGoal,
    contributeToSavingsGoal,
    addCustomCategory,
  } = useFinanceStore();

  const [view, setView] = useState<FinanceView>("dashboard");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [accountDeleteError, setAccountDeleteError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...defaultFinanceCategories, ...customCategories], [customCategories]);
  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const summary = useMemo(() => computeFinanceSummary(accounts, transactions), [accounts, transactions]);

  const accountById = (id: string) => accounts.find((a) => a.id === id);

  const filteredTransactions = useMemo(() => {
    let list = transactions.filter((t) => showArchived || !t.archived);
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (accountFilter) list = list.filter((t) => t.accountId === accountFilter || t.transferToAccountId === accountFilter);
    if (categoryFilter) list = list.filter((t) => t.category === categoryFilter);
    if (favoritesOnly) list = list.filter((t) => t.favorite);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, showArchived, typeFilter, accountFilter, categoryFilter, favoritesOnly, dateFrom, dateTo, search]);

  function closeModal() {
    setModal(null);
    setAccountDeleteError(null);
  }

  function handleExportCsv() {
    const csv = transactionsToCsv(filteredTransactions, accounts);
    downloadCsv(csv, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleFabClick() {
    if (view === "accounts") setModal({ type: "account", id: null });
    else if (view === "budgets") setModal({ type: "budget", id: null });
    else if (view === "bills") setModal({ type: "bill", id: null });
    else if (view === "savings") setModal({ type: "savings", id: null });
    else setModal({ type: "transaction", id: null });
  }

  const editingAccount = modal?.type === "account" && modal.id ? accounts.find((a) => a.id === modal.id) : undefined;
  const editingTransaction = modal?.type === "transaction" && modal.id ? transactions.find((t) => t.id === modal.id) : undefined;
  const editingBudget = modal?.type === "budget" && modal.id ? budgets.find((b) => b.id === modal.id) : undefined;
  const editingBill = modal?.type === "bill" && modal.id ? bills.find((b) => b.id === modal.id) : undefined;
  const editingSavingsGoal = modal?.type === "savings" && modal.id ? savingsGoals.find((g) => g.id === modal.id) : undefined;

  function renderMainContent() {
    switch (view) {
      case "dashboard":
        return (
          <FinanceDashboardView
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            bills={bills}
            savingsGoals={savingsGoals}
            onOpenTransaction={(id) => setModal({ type: "transaction", id })}
            onNavigate={setView}
          />
        );

      case "accounts":
        return accounts.length === 0 ? (
          <EmptyState label="No accounts yet. Add your first one to start tracking transactions." onCreate={() => setModal({ type: "account", id: null })} cta="Add account" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {accounts.map((a, i) => (
              <div key={a.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
                <AccountCard
                  account={a}
                  onSelect={() => setModal({ type: "account", id: a.id })}
                  onArchive={() => archiveAccount(a.id)}
                  onUnarchive={() => unarchiveAccount(a.id)}
                  onDelete={() => {
                    const result = deleteAccount(a.id);
                    if (!result.ok) setAccountDeleteError(result.error ?? "Could not delete this account.");
                  }}
                />
              </div>
            ))}
          </div>
        );

      case "transactions":
        return filteredTransactions.length === 0 ? (
          <EmptyState
            label={transactions.length === 0 ? "No transactions yet." : "No transactions match these filters."}
            onCreate={() => setModal({ type: "transaction", id: null })}
            cta="Add transaction"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredTransactions.map((t, i) => (
              <div key={t.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 20, 240)}ms` } as React.CSSProperties}>
                <TransactionRow
                  transaction={t}
                  account={accountById(t.accountId)}
                  transferAccount={t.transferToAccountId ? accountById(t.transferToAccountId) : undefined}
                  onSelect={() => setModal({ type: "transaction", id: t.id })}
                  onDuplicate={() => duplicateTransaction(t.id)}
                  onArchive={() => archiveTransaction(t.id)}
                  onUnarchive={() => unarchiveTransaction(t.id)}
                  onDelete={() => deleteTransaction(t.id)}
                />
              </div>
            ))}
          </div>
        );

      case "budgets":
        return budgets.length === 0 ? (
          <EmptyState label="No budgets yet. Set one up to track spending by category." onCreate={() => setModal({ type: "budget", id: null })} cta="Add budget" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {budgets.map((b, i) => (
              <div key={b.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
                <BudgetCard budget={b} transactions={transactions} onSelect={() => setModal({ type: "budget", id: b.id })} onDelete={() => deleteBudget(b.id)} />
              </div>
            ))}
          </div>
        );

      case "bills":
        return bills.length === 0 ? (
          <EmptyState label="No bills tracked yet." onCreate={() => setModal({ type: "bill", id: null })} cta="Add bill" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {bills.map((b, i) => (
              <div key={b.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
                <BillRow
                  bill={b}
                  onSelect={() => setModal({ type: "bill", id: b.id })}
                  onTogglePaid={() => markBillPaid(b.id)}
                  onArchive={() => archiveBill(b.id)}
                  onUnarchive={() => unarchiveBill(b.id)}
                  onDelete={() => deleteBill(b.id)}
                />
              </div>
            ))}
          </div>
        );

      case "savings":
        return savingsGoals.length === 0 ? (
          <EmptyState label="No savings goals yet." onCreate={() => setModal({ type: "savings", id: null })} cta="Add savings goal" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {savingsGoals.map((g, i) => (
              <div key={g.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
                <SavingsGoalCard
                  goal={g}
                  accounts={activeAccounts}
                  onSelect={() => setModal({ type: "savings", id: g.id })}
                  onContribute={(amount, accountId) => contributeToSavingsGoal(g.id, amount, accountId)}
                  onArchive={() => archiveSavingsGoal(g.id)}
                  onUnarchive={() => unarchiveSavingsGoal(g.id)}
                  onDelete={() => deleteSavingsGoal(g.id)}
                />
              </div>
            ))}
          </div>
        );

      case "analytics":
        return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <FinanceAnalyticsView accounts={accounts} transactions={transactions} budgets={budgets} savingsGoals={savingsGoals} />
          </Suspense>
        );
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="md:w-64 shrink-0">
          <FinanceSidebar
            ref={searchInputRef}
            view={view}
            onViewChange={setView}
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            accounts={accounts}
            accountFilter={accountFilter}
            onAccountFilterChange={setAccountFilter}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            onAddCategory={addCustomCategory}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyChange={setFavoritesOnly}
            showArchived={showArchived}
            onShowArchivedChange={setShowArchived}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{view}</h2>
            <div className="hidden md:flex items-center gap-2">
              {view === "transactions" && filteredTransactions.length > 0 && (
                <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleFabClick}>
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          </div>

          {accountDeleteError && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{accountDeleteError}</div>
          )}

          {renderMainContent()}
        </div>

        <div className="hidden lg:flex lg:w-64 shrink-0 flex-col gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
              <Wallet className="h-[18px] w-[18px] text-accent-500" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(summary.totalBalance)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Balance</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-[18px] w-[18px] text-success" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(summary.monthlyIncome)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Monthly Income</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
              <TrendingDown className="h-[18px] w-[18px] text-danger" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(summary.monthlyExpenses)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Monthly Expenses</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
              <PiggyBank className="h-[18px] w-[18px] text-accent-500" />
            </div>
            <div>
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatMoney(summary.netSavings)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Net Savings</div>
            </div>
          </Card>
        </div>
      </div>

      <button
        onClick={handleFabClick}
        aria-label="New"
        className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal open={modal?.type === "account"} onClose={closeModal} title={editingAccount ? "Edit account" : "New account"}>
        <AccountForm
          initial={editingAccount}
          onSubmit={(values) => {
            if (editingAccount) updateAccount(editingAccount.id, values);
            else createAccount(values);
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal?.type === "transaction"} onClose={closeModal} title={editingTransaction ? "Edit transaction" : "New transaction"}>
        <TransactionForm
          initial={editingTransaction}
          accounts={accounts}
          categories={categories}
          defaultAccountId={accountFilter ?? undefined}
          onSubmit={(values) => {
            if (editingTransaction) updateTransaction(editingTransaction.id, values);
            else createTransaction(values);
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal?.type === "budget"} onClose={closeModal} title={editingBudget ? "Edit budget" : "New budget"}>
        <BudgetForm
          initial={editingBudget}
          categories={categories}
          onSubmit={(values) => {
            if (editingBudget) updateBudget(editingBudget.id, values);
            else createBudget(values);
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal?.type === "bill"} onClose={closeModal} title={editingBill ? "Edit bill" : "New bill"}>
        <BillForm
          initial={editingBill}
          categories={categories}
          onSubmit={(values) => {
            if (editingBill) updateBill(editingBill.id, values);
            else createBill(values);
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <Modal open={modal?.type === "savings"} onClose={closeModal} title={editingSavingsGoal ? "Edit savings goal" : "New savings goal"}>
        <SavingsGoalForm
          initial={editingSavingsGoal}
          onSubmit={(values) => {
            if (editingSavingsGoal) updateSavingsGoal(editingSavingsGoal.id, values);
            else createSavingsGoal(values);
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}

function EmptyState({ label, cta, onCreate }: { label: string; cta: string; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3 empty-state-in">
      <div className="h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
        <Wallet className="h-6 w-6 text-accent-500" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{label}</p>
      <Button variant="primary" onClick={onCreate}>
        <Plus className="h-4 w-4" /> {cta}
      </Button>
    </div>
  );
}
