import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { paginate, toSkipTake } from "../common/utils/pagination";
import { CreateTransactionDto, TransactionQuery, UpdateTransactionDto } from "./dto/finance.schemas";

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: TransactionQuery) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.accountId && { accountId: query.accountId }),
      ...(query.type && { type: query.type }),
      ...((query.from || query.to) && {
        date: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({ where, orderBy: { date: "desc" }, ...toSkipTake(query) }),
      this.prisma.transaction.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException("Transaction not found");
    if (transaction.userId !== userId) throw new ForbiddenException();
    return transaction;
  }

  /** Creates the transaction and applies its balance effect to the account(s) atomically. */
  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: dto.accountId } });
      if (!account || account.userId !== userId) throw new NotFoundException("Source account not found");

      if (dto.type === "transfer") {
        if (!dto.transferToAccountId) throw new BadRequestException("transferToAccountId is required for transfers");
        const destination = await tx.account.findUnique({ where: { id: dto.transferToAccountId } });
        if (!destination || destination.userId !== userId) throw new NotFoundException("Destination account not found");

        await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: dto.amount } } });
        await tx.account.update({ where: { id: destination.id }, data: { balance: { increment: dto.amount } } });
      } else {
        const delta = dto.type === "income" ? dto.amount : -dto.amount;
        await tx.account.update({ where: { id: account.id }, data: { balance: { increment: delta } } });
      }

      return tx.transaction.create({
        data: { userId, ...dto, date: new Date(dto.date) },
      });
    });
  }

  /** Non-balance-affecting fields only — changing amount/type/account requires delete + recreate to keep balances honest. */
  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    await this.findOne(userId, id);
    return this.prisma.transaction.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  /** Reverses the transaction's balance effect, then deletes it, atomically. */
  async remove(userId: string, id: string) {
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({ where: { id } });
      if (!transaction) throw new NotFoundException("Transaction not found");
      if (transaction.userId !== userId) throw new ForbiddenException();

      if (transaction.type === "transfer" && transaction.transferToAccountId) {
        await tx.account.update({ where: { id: transaction.accountId }, data: { balance: { increment: transaction.amount } } });
        await tx.account.update({
          where: { id: transaction.transferToAccountId },
          data: { balance: { decrement: transaction.amount } },
        });
      } else {
        const delta = transaction.type === "income" ? -Number(transaction.amount) : Number(transaction.amount);
        await tx.account.update({ where: { id: transaction.accountId }, data: { balance: { increment: delta } } });
      }

      await tx.transaction.delete({ where: { id } });
    });
  }
}
