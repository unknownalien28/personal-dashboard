import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { BillsController } from "./bills.controller";
import { BillsService } from "./bills.service";
import { SavingsGoalsController } from "./savings-goals.controller";
import { SavingsGoalsService } from "./savings-goals.service";

@Module({
  controllers: [AccountsController, TransactionsController, BudgetsController, BillsController, SavingsGoalsController],
  providers: [AccountsService, TransactionsService, BudgetsService, BillsService, SavingsGoalsService],
})
export class FinanceModule {}
