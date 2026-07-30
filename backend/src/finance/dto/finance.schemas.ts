import { z } from "zod";
import { noteColorEnum } from "../../notes/dto/note.schemas";
import { reminderOptionEnum, repeatOptionEnum } from "../../calendar/dto/calendar.schemas";

export const accountTypeEnum = z.enum([
  "cash",
  "bank",
  "savings",
  "creditCard",
  "investment",
  "digitalWallet",
  "custom",
]);

export const createAccountSchema = z.object({
  name: z.string().min(1).max(200),
  type: accountTypeEnum.default("cash"),
  color: noteColorEnum.default("default"),
  icon: z.string().default(""),
  currency: z.string().default("NGN"),
  openingBalance: z.number().default(0),
  notes: z.string().default(""),
});
export type CreateAccountDto = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial().extend({ archived: z.boolean().optional() });
export type UpdateAccountDto = z.infer<typeof updateAccountSchema>;

export const transactionTypeEnum = z.enum(["income", "expense", "transfer"]);

export const createTransactionSchema = z
  .object({
    type: transactionTypeEnum,
    amount: z.number().positive(),
    category: z.string().default(""),
    accountId: z.string().uuid(),
    transferToAccountId: z.string().uuid().nullable().optional(),
    date: z.string().datetime(),
    time: z.string().nullable().optional(),
    notes: z.string().default(""),
    tags: z.array(z.string()).default([]),
    hasReceipt: z.boolean().default(false),
    recurring: z.boolean().default(false),
    favorite: z.boolean().default(false),
  })
  .refine((data) => data.type !== "transfer" || !!data.transferToAccountId, {
    message: "transferToAccountId is required when type is 'transfer'",
    path: ["transferToAccountId"],
  });
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  category: z.string().optional(),
  date: z.string().datetime().optional(),
  time: z.string().nullable().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasReceipt: z.boolean().optional(),
  recurring: z.boolean().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  accountId: z.string().uuid().optional(),
  type: transactionTypeEnum.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;

export const budgetPeriodEnum = z.enum(["weekly", "monthly", "yearly"]);

export const createBudgetSchema = z.object({
  category: z.string().min(1).max(200),
  amount: z.number().positive(),
  period: budgetPeriodEnum.default("monthly"),
});
export type CreateBudgetDto = z.infer<typeof createBudgetSchema>;
export const updateBudgetSchema = createBudgetSchema.partial();
export type UpdateBudgetDto = z.infer<typeof updateBudgetSchema>;

export const createBillSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().default(""),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  reminder: reminderOptionEnum.default("none"),
  autoRepeat: repeatOptionEnum.default("none"),
  paid: z.boolean().default(false),
});
export type CreateBillDto = z.infer<typeof createBillSchema>;
export const updateBillSchema = createBillSchema.partial().extend({ archived: z.boolean().optional() });
export type UpdateBillDto = z.infer<typeof updateBillSchema>;

export const createSavingsGoalSchema = z.object({
  title: z.string().min(1).max(200),
  targetAmount: z.number().positive(),
  deadline: z.string().datetime().nullable().optional(),
  color: noteColorEnum.default("default"),
  icon: z.string().default(""),
});
export type CreateSavingsGoalDto = z.infer<typeof createSavingsGoalSchema>;
export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({ archived: z.boolean().optional() });
export type UpdateSavingsGoalDto = z.infer<typeof updateSavingsGoalSchema>;

export const addContributionSchema = z.object({
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
});
export type AddContributionDto = z.infer<typeof addContributionSchema>;
