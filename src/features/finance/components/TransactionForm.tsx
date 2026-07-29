import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { TransactionInput } from "@/features/finance/finance-store";
import type { Account, Transaction, TransactionType } from "@/types/models";
import { useShake } from "@/hooks/useShake";
import { cn } from "@/lib/utils/cn";

interface TransactionFormProps {
  initial?: Transaction;
  accounts: Account[];
  categories: string[];
  defaultAccountId?: string;
  onSubmit: (values: TransactionInput) => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, accounts, categories, defaultAccountId, onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Other");
  const [accountId, setAccountId] = useState(initial?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState(
    initial?.transferToAccountId ?? accounts.find((a) => a.id !== accountId)?.id ?? ""
  );
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initial?.time ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") ?? "");
  const [hasReceipt, setHasReceipt] = useState(initial?.hasReceipt ?? false);
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
  const amountShake = useShake();

  const availableTransferTargets = accounts.filter((a) => a.id !== accountId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0 || !accountId) {
      amountShake.trigger();
      return;
    }
    if (type === "transfer" && !transferToAccountId) return;

    onSubmit({
      type,
      amount: numericAmount,
      category: type === "transfer" ? "Transfer" : category,
      accountId,
      transferToAccountId: type === "transfer" ? transferToAccountId : null,
      date,
      time: time || null,
      notes: notes.trim(),
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      hasReceipt,
      recurring,
      favorite,
    });
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
        Create an account first before adding transactions.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
          { value: "transfer", label: "Transfer" },
        ]}
        className="w-full"
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Amount</label>
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onAnimationEnd={amountShake.onAnimationEnd}
          placeholder="0.00"
          className={cn(
            "w-full h-11 rounded-lg border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400",
            amountShake.shaking ? "border-danger field-shake" : "border-[var(--color-border)]"
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            {type === "transfer" ? "From account" : "Account"}
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {type === "transfer" ? (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">To account</label>
            <select
              value={transferToAccountId}
              onChange={(e) => setTransferToAccountId(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            >
              {availableTransferTargets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Time (optional)</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Tags (comma separated)</label>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. work, reimbursable"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={hasReceipt} onChange={(e) => setHasReceipt(e.target.checked)} className="h-4 w-4 rounded accent-accent-500" />
          Has receipt
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 rounded accent-accent-500" />
          Recurring
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} className="h-4 w-4 rounded accent-accent-500" />
          Favorite
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
