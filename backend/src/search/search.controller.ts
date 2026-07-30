import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { SearchService } from "./search.service";

@ApiTags("search")
@ApiBearerAuth("access-token")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@CurrentUser() user: AuthenticatedUser, @Query("q") q = "", @Query("limit") limit?: string) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100) : 20;
    return this.searchService.search(user.id, q, parsedLimit);
  }
}
