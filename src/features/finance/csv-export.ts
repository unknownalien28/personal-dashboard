import type { Account, Transaction } from "@/types/models";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function transactionsToCsv(transactions: Transaction[], accounts: Account[]): string {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "Unknown";
  const header = ["Date", "Time", "Type", "Category", "Account", "Transfer To", "Amount", "Tags", "Notes", "Favorite", "Archived"];

  const rows = transactions.map((t) => [
    t.date,
    t.time ?? "",
    t.type,
    t.category,
    accountName(t.accountId),
    t.transferToAccountId ? accountName(t.transferToAccountId) : "",
    t.amount.toFixed(2),
    t.tags.join("; "),
    t.notes,
    t.favorite ? "Yes" : "No",
    t.archived ? "Yes" : "No",
  ]);

  return [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
