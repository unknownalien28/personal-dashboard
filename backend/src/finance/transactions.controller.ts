import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { TransactionsService } from "./transactions.service";
import {
  CreateTransactionDto,
  TransactionQuery,
  UpdateTransactionDto,
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from "./dto/finance.schemas";

@ApiTags("finance")
@ApiBearerAuth("access-token")
@Controller("finance/transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQuery,
  ) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createTransactionSchema)) dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.transactionsService.remove(user.id, id);
  }
}
