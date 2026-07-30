import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { AccountsService } from "./accounts.service";
import {
  CreateAccountDto,
  UpdateAccountDto,
  createAccountSchema,
  updateAccountSchema,
} from "./dto/finance.schemas";

@ApiTags("finance")
@ApiBearerAuth("access-token")
@Controller("finance/accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.accountsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.accountsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createAccountSchema)) dto: CreateAccountDto) {
    return this.accountsService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(user.id, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.accountsService.remove(user.id, id);
  }
}
