import { Injectable } from "@nestjs/common";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "../../finance/accounts.service";
import { TransactionsService } from "../../finance/transactions.service";
import { createTransactionSchema } from "../../finance/dto/finance.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateTransactionTool implements AiTool {
  readonly name = "create_finance_transaction";
  readonly description =
    "Record an income, expense, or transfer transaction against one of the user's accounts. If you don't know the account id, pass accountName instead and it will be resolved for you.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      type: { type: "string", enum: ["income", "expense", "transfer"] },
      amount: { type: "number", description: "Positive amount." },
      category: { type: "string" },
      accountId: { type: "string", description: "The source account's id, if known." },
      accountName: { type: "string", description: "The source account's name — used to look up accountId if accountId isn't provided." },
      transferToAccountId: { type: "string", description: "Required if type is 'transfer'." },
      transferToAccountName: { type: "string", description: "Alternative to transferToAccountId." },
      date: { type: "string", description: "ISO-8601 date/time. Defaults to now if omitted." },
      notes: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["type", "amount"],
  };

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
  ) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const accounts = await this.accountsService.findAll(userId);
    if (accounts.length === 0) {
      return { success: false, message: "The user has no finance accounts yet — an account must be created before recording transactions." };
    }

    const resolvedAccountId = await this.resolveAccountId(args.accountId, args.accountName, accounts);
    if (!resolvedAccountId.ok) return { success: false, message: resolvedAccountId.message };

    let resolvedTransferToId: string | undefined;
    if (args.type === "transfer") {
      const resolved = await this.resolveAccountId(args.transferToAccountId, args.transferToAccountName, accounts);
      if (!resolved.ok) return { success: false, message: resolved.message };
      resolvedTransferToId = resolved.id;
    }

    const parsed = createTransactionSchema.safeParse({
      ...args,
      accountId: resolvedAccountId.id,
      transferToAccountId: resolvedTransferToId,
      date: typeof args.date === "string" ? args.date : new Date().toISOString(),
    });
    if (!parsed.success) {
      return { success: false, message: `Invalid transaction input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    try {
      const transaction = await this.transactionsService.create(userId, parsed.data);
      return {
        success: true,
        message: `Recorded ${transaction.type} of ${transaction.amount} (id: ${transaction.id}).`,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return { success: false, message: error.message };
      }
      throw error;
    }
  }

  private async resolveAccountId(
    accountId: unknown,
    accountName: unknown,
    accounts: Array<{ id: string; name: string }>,
  ): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
    if (typeof accountId === "string" && accountId) {
      const found = accounts.find((a) => a.id === accountId);
      if (!found) return { ok: false, message: `No account found with id ${accountId}.` };
      return { ok: true, id: found.id };
    }

    if (typeof accountName === "string" && accountName.trim()) {
      const needle = accountName.trim().toLowerCase();
      const matches = accounts.filter((a) => a.name.toLowerCase().includes(needle));
      if (matches.length === 0) {
        return {
          ok: false,
          message: `No account matching "${accountName}". Available accounts: ${accounts.map((a) => a.name).join(", ")}.`,
        };
      }
      if (matches.length > 1) {
        return {
          ok: false,
          message: `Multiple accounts match "${accountName}": ${matches.map((a) => a.name).join(", ")}. Ask the user which one they mean.`,
        };
      }
      return { ok: true, id: matches[0].id };
    }

    return {
      ok: false,
      message: `An account is required. Available accounts: ${accounts.map((a) => a.name).join(", ")}.`,
    };
  }
}
