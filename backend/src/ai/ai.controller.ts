import { Body, Controller, Get, Post, Req, Sse } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Observable, from, map, finalize } from "rxjs";
import type { Request } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { SkipResponseTransform } from "../common/decorators/skip-response-transform.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthenticatedUser } from "../auth/types/authenticated-user.interface";
import { AiService } from "./ai.service";
import { SendMessageDto, sendMessageSchema } from "./dto/ai.schemas";

@ApiTags("ai")
@ApiBearerAuth("access-token")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("status")
  @ApiOperation({
    summary: "AI status",
    description:
      "Returns whether Gemini (AlienOS's only AI provider) is configured right now (i.e. has an API key set). The frontend uses this to show a clear message in Settings > AI if it isn't, rather than letting a chat attempt silently fail.",
  })
  @ApiResponse({ status: 200, description: "Gemini's configuration status." })
  getStatus() {
    return this.aiService.getStatus();
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
      "Persists the user's message, runs the tool-calling loop if Gemini requests any actions, persists the assistant's reply (and any tool actions taken) and returns the final message. Returns a clear error if Gemini isn't configured or the request fails - never silently substitutes a different response.",
  })
  @ApiResponse({ status: 201, description: "The assistant's reply." })
  @ApiResponse({ status: 403, description: "AI is disabled in the user's AI Settings." })
  @ApiResponse({ status: 503, description: "Gemini isn't configured, or the request to it failed." })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
    @Req() req: Request,
  ) {
    // Same pattern Nest's own SSE machinery uses internally (listen for the
    // underlying connection closing): if the client navigates away or the
    // tab closes before the provider responds, stop paying for/waiting on
    // that request instead of letting it run to completion unobserved.
    const abortController = new AbortController();
    req.on("close", () => abortController.abort());
    return this.aiService.sendMessage(user.id, user.email, dto, abortController.signal);
  }

  @Post("messages/stream")
  @Sse("messages/stream")
  @SkipResponseTransform()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: "Send a chat message to Alien and stream the reply (Server-Sent Events)",
    description:
      "Same behavior as POST /ai/messages, but streams the response as it's generated: 'token' events for partial text, 'tool_call'/'tool_result' events when Alien takes an action, and a final 'done' event once the reply is fully persisted. Disconnecting the client aborts the in-flight Gemini request." +
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
