import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { BillsService } from "./bills.service";
import { CreateBillDto, UpdateBillDto, createBillSchema, updateBillSchema } from "./dto/finance.schemas";

const markPaidSchema = z.object({ paid: z.boolean() });

@ApiTags("finance")
@ApiBearerAuth("access-token")
@Controller("finance/bills")
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.billsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.billsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createBillSchema)) dto: CreateBillDto) {
    return this.billsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBillSchema)) dto: UpdateBillDto,
  ) {
    return this.billsService.update(user.id, id, dto);
  }

  @Patch(":id/paid")
  markPaid(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(markPaidSchema)) dto: { paid: boolean },
  ) {
    return this.billsService.markPaid(user.id, id, dto.paid);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.billsService.remove(user.id, id);
  }
}
