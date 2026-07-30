import { Body, Controller, Get, Post, Sse } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Observable, from, map } from "rxjs";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { AiService } from "./ai.service";
import { SendMessageDto, sendMessageSchema } from "./dto/ai.schemas";

@ApiTags("ai")
@ApiBearerAuth("access-token")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("providers")
  listProviders() {
    return { providers: this.aiService.listProviders() };
  }

  @Post("messages")
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto) {
    return this.aiService.sendMessage(user.id, user.email, dto);
  }

  /** Server-Sent Events variant for real-time token streaming once real providers land. */
  @Sse("messages/stream")
  streamMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ): Observable<{ data: unknown }> {
    return from(this.aiService.stream(user.id, user.email, dto)).pipe(map((chunk) => ({ data: chunk })));
  }
}
