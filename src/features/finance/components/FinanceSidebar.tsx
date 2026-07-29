import { forwardRef, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Receipt,
  Target,
  BarChart3,
  Search,
  Star,
  Archive,
  Plus,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/utils/cn";
import type { Account, TransactionType } from "@/types/models";

export type FinanceView = "dashboard" | "transactions" | "accounts" | "budgets" | "bills" | "savings" | "analytics";

const views: { value: FinanceView; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { value: "accounts", label: "Accounts", icon: Wallet },
  { value: "budgets", label: "Budgets", icon: PiggyBank },
  { value: "bills", label: "Bills", icon: Receipt },
  { value: "savings", label: "Savings Goals", icon: Target },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
];

export type TransactionTypeFilter = "all" | TransactionType;

interface FinanceSidebarProps {
  view: FinanceView;
  onViewChange: (view: FinanceView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: TransactionTypeFilter;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  accounts: Account[];
  accountFilter: string | null;
  onAccountFilterChange: (id: string | null) => void;
  categories: string[];
  categoryFilter: string | null;
  onCategoryFilterChange: (value: string | null) => void;
  onAddCategory: (name: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
}

export const FinanceSidebar = forwardRef<HTMLInputElement, FinanceSidebarProps>(
  (
    {
      view,
      onViewChange,
      search,
      onSearchChange,
      typeFilter,
      onTypeFilterChange,
      accounts,
      accountFilter,
      onAccountFilterChange,
      categories,
      categoryFilter,
      onCategoryFilterChange,
      onAddCategory,
      dateFrom,
      onDateFromChange,
      dateTo,
      onDateToChange,
      favoritesOnly,
      onFavoritesOnlyChange,
      showArchived,
      onShowArchivedChange,
    },
    searchRef
  ) => {
    const [newCategory, setNewCategory] = useState("");

    function handleAddCategory(e: React.FormEvent) {
      e.preventDefault();
      if (newCategory.trim()) {
        onAddCategory(newCategory.trim());
        setNewCategory("");
      }
    }

    return (
      <div className="flex flex-col gap-5">
        <nav aria-label="Finance views" className="flex flex-col gap-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              aria-current={view === v.value}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 h-10 md:h-9 text-sm font-medium text-left transition-colors duration-150",
                view === v.value
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <v.icon className="h-4 w-4 shrink-0" />
              {v.label}
            </button>
          ))}
        </nav>

        {view === "transactions" && (
          <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
            <label className="relative block">
              <span className="sr-only">Search transactions</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search category, notes, tags..."
                className="w-full h-11 md:h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              />
            </label>

            <SegmentedControl
              value={typeFilter}
              onChange={onTypeFilterChange}
              options={[
                { value: "all", label: "All" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer" },
              ]}
              className="w-full flex-wrap"
            />

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Account</label>
              <select
                value={accountFilter ?? "all"}
                onChange={(e) => onAccountFilterChange(e.target.value === "all" ? null : e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="all">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
              <select
                value={categoryFilter ?? "all"}
                onChange={(e) => onCategoryFilterChange(e.target.value === "all" ? null : e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <form onSubmit={handleAddCategory} className="flex gap-1.5 mt-1.5">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category"
                  aria-label="New category name"
                  className="flex-1 h-8 rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />
                <button
                  type="submit"
                  aria-label="Add category"
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Date range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />
                <span className="text-zinc-400 text-xs shrink-0">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
            </div>

            <label className="flex items-center justify-between h-9">
              <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Star className="h-4 w-4" /> Favorites only
              </span>
              <input type="checkbox" checked={favoritesOnly} onChange={(e) => onFavoritesOnlyChange(e.target.checked)} className="h-4 w-4 rounded accent-accent-500" />
            </label>

            <label className="flex items-center justify-between h-9">
              <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Archive className="h-4 w-4" /> Show archived
              </span>
              <input type="checkbox" checked={showArchived} onChange={(e) => onShowArchivedChange(e.target.checked)} className="h-4 w-4 rounded accent-accent-500" />
            </label>
          </div>
        )}
      </div>
    );
  }
);

FinanceSidebar.displayName = "FinanceSidebar";
