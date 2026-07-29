import { Wallet, Landmark, PiggyBank, CreditCard, TrendingUp, Smartphone, Layers, type LucideIcon } from "lucide-react";
import type { AccountType } from "@/types/models";

export const accountTypes: AccountType[] = ["cash", "bank", "savings", "creditCard", "investment", "digitalWallet", "custom"];

export const accountTypeConfig: Record<AccountType, { label: string; icon: LucideIcon }> = {
  cash: { label: "Cash", icon: Wallet },
  bank: { label: "Bank", icon: Landmark },
  savings: { label: "Savings", icon: PiggyBank },
  creditCard: { label: "Credit Card", icon: CreditCard },
  investment: { label: "Investment", icon: TrendingUp },
  digitalWallet: { label: "Digital Wallet", icon: Smartphone },
  custom: { label: "Custom", icon: Layers },
};

export const currencies = ["USD", "EUR", "GBP", "NGN", "CAD", "AUD", "JPY", "INR"] as const;
