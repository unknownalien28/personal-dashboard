import { Body, Controller, Get, Post, Sse } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Observable, from, map, finalize } from "rxjs";
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
  @ApiOperation({
    summary: "List AI providers and their configuration status",
    description:
      "Returns every registered provider (demo, gemini, openai, anthropic, ollama) and whether each is actually usable right now (i.e. has an API key configured). The frontend uses this to populate Settings > AI without ever needing to know which one is actually selected under the hood.",
  })
  @ApiResponse({ status: 200, description: "List of providers with their configured status." })
  listProviders() {
    return { providers: this.aiService.listProviders() };
  }

  @Get("tools")
  @ApiOperation({
    summary: "List tools Alien can use to take actions in AlienOS",
    description: "Returns the JSON-Schema definition of every tool available to the AI orchestration layer (create/update task, notes, goals, calendar events, finance transactions, dashboard stats, search, notifications, etc).",
  })
  @ApiResponse({ status: 200, description: "List of available tool definitions." })
  listTools() {
    return { tools: this.aiService.listTools() };
  }

  @Post("messages")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: "Send a chat message to Alien",
    description:
      "Persists the user's message, resolves the active AI provider (Gemini by default, falling back gracefully if unavailable), runs the tool-calling loop if the model requests any actions, persists the assistant's reply (and any tool actions taken) and returns the final message.",
  })
  @ApiResponse({ status: 201, description: "The assistant's reply, including which provider actually answered." })
  @ApiResponse({ status: 403, description: "AI is disabled in the user's AI Settings." })
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto) {
    return this.aiService.sendMessage(user.id, user.email, dto);
  }

  @Post("messages/stream")
  @Sse("messages/stream")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: "Send a chat message to Alien and stream the reply (Server-Sent Events)",
    description:
      "Same behavior as POST /ai/messages, but streams the response as it's generated: 'token' events for partial text, 'tool_call'/'tool_result' events when Alien takes an action, and a final 'done' event once the reply is fully persisted. Disconnecting the client aborts the in-flight provider request." +
      " Deliberately POST (not the plain GET the @Sse decorator defaults to): the browser's native EventSource API can only send unauthenticated GET requests with no custom body, which doesn't work with our Bearer-token auth or JSON payload — see streamSse() in the frontend's src/lib/api/client.ts.",
  })
  @ApiResponse({ status: 200, description: "text/event-stream of { type, ... } events — see AiStreamEvent." })
  streamMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ): Observable<{ data: unknown }> {
    // Wired to the SSE subscription's teardown so a client disconnect (tab
    // closed, navigated away, explicit cancel) aborts the upstream provider
    // request instead of letting it run to completion unobserved.
    const abortController = new AbortController();
    return from(this.aiService.stream(user.id, user.email, dto, abortController.signal)).pipe(
      map((event) => ({ data: event })),
      finalize(() => abortController.abort()),
    );
  }
}
