import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { assertOwned } from "../common/utils/ownership";
import { CreateAccountDto, UpdateAccountDto } from "./dto/finance.schemas";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    assertOwned(account, userId, "Account not found");
    return account;
  }

  create(userId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: { userId, ...dto, balance: dto.openingBalance },
    });
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findOne(userId, id);
    // Note: openingBalance changes intentionally do NOT retroactively adjust
    // `balance` here — that reconciliation is a deliberate follow-up action,
    // not an implicit side effect of an edit.
    return this.prisma.account.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.account.delete({ where: { id } });
  }
}
