import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { financeColors, financeColorConfig } from "@/features/finance/finance-color-config";
import { accountTypes, accountTypeConfig, currencies } from "@/features/finance/account-config";
import type { AccountInput } from "@/features/finance/finance-store";
import type { Account, AccountType, NoteColor } from "@/types/models";
import { cn } from "@/lib/utils/cn";

interface AccountFormProps {
  initial?: Account;
  onSubmit: (values: AccountInput) => void;
  onCancel: () => void;
}

export function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "bank");
  const [color, setColor] = useState<NoteColor>(initial?.color ?? "default");
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [openingBalance, setOpeningBalance] = useState(initial ? String(initial.openingBalance) : "0");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      color,
      icon: accountTypeConfig[type].label.toLowerCase(),
      currency,
      openingBalance: Number(openingBalance) || 0,
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Account name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chase Checking"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Type</label>
        <div className="grid grid-cols-4 gap-1.5">
          {accountTypes.map((t) => {
            const Icon = accountTypeConfig[t].icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[10px] font-medium transition-colors duration-150",
                  type === t
                    ? "border-accent-400 bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400"
                    : "border-[var(--color-border)] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {accountTypeConfig[t].label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Color</label>
        <div className="flex items-center gap-2">
          {financeColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`${financeColorConfig[c].label} color`}
              aria-pressed={color === c}
              className={cn(
                "h-7 w-7 rounded-full transition-transform",
                financeColorConfig[c].swatchClass,
                color === c && "ring-2 ring-offset-2 ring-accent-400 dark:ring-offset-zinc-900 scale-110"
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            {initial ? "Opening balance" : "Starting balance"}
          </label>
          <input
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            disabled={!!initial}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-50"
          />
          {initial && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
              Opening balance is locked after creation — current balance updates automatically from transactions.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
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

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {initial ? "Save changes" : "Create account"}
        </Button>
      </div>
    </form>
  );
}
