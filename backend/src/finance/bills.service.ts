import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateBillDto, UpdateBillDto } from "./dto/finance.schemas";

@Injectable()
export class BillsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.bill.findMany({ where: { userId }, orderBy: { dueDate: "asc" } });
  }

  async findOne(userId: string, id: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException("Bill not found");
    if (bill.userId !== userId) throw new ForbiddenException();
    return bill;
  }

  create(userId: string, dto: CreateBillDto) {
    return this.prisma.bill.create({ data: { userId, ...dto, dueDate: new Date(dto.dueDate) } });
  }

  async update(userId: string, id: string, dto: UpdateBillDto) {
    await this.findOne(userId, id);
    return this.prisma.bill.update({
      where: { id },
      data: { ...dto, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
  }

  async markPaid(userId: string, id: string, paid: boolean) {
    await this.findOne(userId, id);
    return this.prisma.bill.update({ where: { id }, data: { paid } });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.bill.delete({ where: { id } });
  }
}
