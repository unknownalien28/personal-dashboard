import { ForbiddenException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConversationsService } from "../conversations/conversations.service";
import { UsersService } from "../users/users.service";
import { AiMessage, AiTokenUsage, AiToolCall } from "./providers/gemini.types";
import { GeminiProvider } from "./providers/gemini.provider";
import { PromptManagerService } from "./prompt-manager.service";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { SendMessageDto } from "./dto/ai.schemas";

/** Fields consumed from a persisted ChatMessage row — typed locally so this file doesn't depend on the generated Prisma client shape lining up exactly. */
interface ChatMessageRow {
  role: string;
  content: string;
  actionTool: string | null;
  actionStatus: string | null;
  actionResult: string | null;
}

export interface ToolActionSummary {
  tool: string;
  args: Record<string, unknown>;
  status: "executed" | "failed";
  resultMessage: string;
}

export interface SendMessageResult {
  conversationId: string;
  message: Awaited<ReturnType<ConversationsService["addMessage"]>>;
  actions: ToolActionSummary[];
  /** Token usage for this turn. When a turn involves multiple tool-calling iterations (more than one Gemini call), this is the sum across all of them - the true cost of the turn, not just the final reply. */
  usage?: AiTokenUsage;
}

export type AiStreamEvent =
  | { type: "token"; delta: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; success: boolean; message: string }
  | { type: "done"; conversationId: string; usage?: AiTokenUsage }
  | { type: "error"; message: string };

/** Sums token usage across multiple Gemini calls within a single turn (tool-calling iterations each invoke Gemini again). Fields present on either side are added; a field absent on both stays absent rather than becoming 0, so "no data available" is distinguishable from "used zero tokens". */
function addUsage(a: AiTokenUsage | undefined, b: AiTokenUsage | undefined): AiTokenUsage | undefined {
  if (!a) return b;
  if (!b) return a;
  const sum = (x?: number, y?: number) => (x === undefined && y === undefined ? undefined : (x ?? 0) + (y ?? 0));
  return {
    promptTokens: sum(a.promptTokens, b.promptTokens),
    completionTokens: sum(a.completionTokens, b.completionTokens),
    totalTokens: sum(a.totalTokens, b.totalTokens),
  };
}

/**
 * AlienOS's AI orchestration layer: builds the prompt/context, drives the
 * tool-calling loop, persists conversation memory, tracks token usage, and
 * produces the result the controller forwards to the frontend (as a single
 * JSON response or as SSE events).
 *
 * Single-provider architecture: Gemini is the only AI provider. There is
 * deliberately no provider selection, priority chain, health tracking, or
 * fallback to a canned response here - if Gemini is unavailable (missing
 * API key) or a request genuinely fails, that's reported to the caller as
 * a clear error (see assertGeminiAvailable() and the try/catch blocks
 * below), never silently swapped for something else. See
 * MIGRATION_REPORT_2026-08-02-single-provider.md for the reasoning and
 * what reintroducing another provider would involve.
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly gemini: GeminiProvider,
    private readonly promptManager: PromptManagerService,
    private readonly conversationsService: ConversationsService,
    private readonly usersService: UsersService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly config: ConfigService,
  ) {}

  private get maxToolIterations(): number {
    return this.config.get<number>("ai.maxToolIterations") ?? 4;
  }

  /** Used by GET /ai/status so the frontend can show whether Gemini is configured, without needing to know anything else about the AI layer. */
  getStatus() {
    return { provider: "gemini", configured: this.gemini.isConfigured() };
  }

  listTools() {
    return this.toolRegistry.getDefinitions();
  }

  /**
   * Converts persisted ChatMessage rows into AiMessage history. Tool
   * actions are folded into a short text summary rather than replayed as
   * literal tool_call/tool_result blocks - this keeps stored conversation
   * memory stable even if the tool-calling schema changes in a future
   * phase.
   */
  private historyFromConversation(conversation: Awaited<ReturnType<ConversationsService["findOne"]>>): AiMessage[] {
    return conversation.messages.map((m: ChatMessageRow): AiMessage => {
      if (m.role === "assistant" && m.actionTool) {
        const summary = `[action] called ${m.actionTool} → ${m.actionStatus}${m.actionResult ? `: ${m.actionResult}` : ""}`;
        return { role: "assistant", content: m.content ? `${m.content}\n\n${summary}` : summary };
      }
      return { role: m.role as AiMessage["role"], content: m.content };
    });
  }

  /** Confirms AI is turned on for this user and Gemini is actually configured. Throws a clear, user-facing error otherwise - never falls back to anything else. */
  private async assertGeminiAvailable(userId: string) {
    const settings = await this.usersService.getAISettings(userId);
    if (settings.enabled === false) {
      throw new ForbiddenException("AI is turned off in your settings. Enable it under Settings > AI to chat with Alien.");
    }
    if (!this.gemini.isConfigured()) {
      throw new ServiceUnavailableException(
        "Alien's AI isn't configured right now (missing Gemini API key). Please contact your administrator, or set AI_GEMINI_API_KEY in the backend environment.",
      );
    }
    return settings;
  }

  async sendMessage(userId: string, userName: string | undefined, dto: SendMessageDto, signal?: AbortSignal): Promise<SendMessageResult> {
    const conversationId =
      dto.conversationId ?? (await this.conversationsService.create(userId, { title: dto.content.slice(0, 60) })).id;

    await this.conversationsService.addMessage(userId, conversationId, { role: "user", content: dto.content, status: "complete" });

    const settings = await this.assertGeminiAvailable(userId);
    const conversation = await this.conversationsService.findOne(userId, conversationId);

    const model = dto.model ?? (settings.model || undefined);
    const temperature = dto.temperature ?? settings.temperature;
    const maxTokens = dto.maxTokens ?? settings.maxTokens;

    let finalText = "";
    const actions: ToolActionSummary[] = [];
    let turnMessages: AiMessage[] = [];
    let turnUsage: AiTokenUsage | undefined;

    for (let iteration = 0; iteration < this.maxToolIterations; iteration++) {
      if (signal?.aborted) {
        finalText = "Request cancelled.";
        break;
      }
      const baseMessages = this.promptManager.buildMessages(
        { userName, moduleHints: dto.moduleHints, toolsAvailable: true },
        this.historyFromConversation(conversation),
      );
      // Re-apply any tool round-trips accumulated so far this turn.
      const messages = [...baseMessages, ...turnMessages];
      const tools = this.toolRegistry.getDefinitions();

      const attemptStart = Date.now();
      let result: Awaited<ReturnType<GeminiProvider["complete"]>>;
      try {
        result = await this.gemini.complete({ messages, model, temperature, maxTokens, tools, signal });
      } catch (error) {
        const latencyMs = Date.now() - attemptStart;
        if (signal?.aborted) {
          this.logger.log(`AI turn cancelled: conversation=${conversationId} latencyMs=${latencyMs}`);
          finalText = "Request cancelled.";
          break;
        }
        this.logger.warn(`AI turn failed: conversation=${conversationId} latencyMs=${latencyMs} error="${describeError(error)}"`);
        throw new ServiceUnavailableException(
          `Alien couldn't reach Gemini just now (${describeError(error)}). Please try again in a moment.`,
        );
      }

      const latencyMs = Date.now() - attemptStart;
      turnUsage = addUsage(turnUsage, result.usage);
      this.logger.log(
        `AI turn succeeded: conversation=${conversationId} latencyMs=${latencyMs} ` +
          `promptTokens=${result.usage?.promptTokens ?? "n/a"} completionTokens=${result.usage?.completionTokens ?? "n/a"} ` +
          `totalTokens=${result.usage?.totalTokens ?? "n/a"} finishReason=${result.finishReason}`,
      );

      if (result.finishReason === "tool_calls" && result.toolCalls?.length) {
        turnMessages = [...turnMessages, { role: "assistant", content: result.content, toolCalls: result.toolCalls }];
        for (const call of result.toolCalls) {
          const toolResult = await this.executeAndPersistTool(userId, conversationId, call, result.content);
          actions.push({
            tool: call.name,
            args: call.arguments,
            status: toolResult.success ? "executed" : "failed",
            resultMessage: toolResult.message,
          });
          turnMessages = [
            ...turnMessages,
            {
              role: "tool",
              content: JSON.stringify(toolResult.data ?? { message: toolResult.message }),
              toolCallId: call.id,
              name: call.name,
            },
          ];
        }
        continue;
      }

      finalText = result.content;
      break;
    }

    if (!finalText) {
      finalText = "I took a few actions but didn't get a final answer back — could you tell me what you'd like next?";
    }

    const assistantMessage = await this.conversationsService.addMessage(userId, conversationId, {
      role: "assistant",
      content: finalText,
      status: "complete",
    });

    this.logger.log(
      `AI turn complete: conversation=${conversationId} ` +
        `totalPromptTokens=${turnUsage?.promptTokens ?? "n/a"} totalCompletionTokens=${turnUsage?.completionTokens ?? "n/a"} ` +
        `totalTokens=${turnUsage?.totalTokens ?? "n/a"} actionsCount=${actions.length}`,
    );

    return { conversationId, message: assistantMessage, actions, usage: turnUsage };
  }

  /** Executes one tool call and persists it as its own ChatMessage (action metadata), reusing the existing action fields on the schema. */
  private async executeAndPersistTool(userId: string, conversationId: string, call: AiToolCall, assistantNote: string) {
    const toolResult = await this.toolRegistry.execute(call.name, userId, call.arguments);
    await this.conversationsService.addMessage(userId, conversationId, {
      role: "assistant",
      content: assistantNote ?? "",
      status: "complete",
      action: {
        tool: call.name,
        args: call.arguments,
        status: toolResult.success ? "executed" : "failed",
        resultMessage: toolResult.message,
      },
    });
    return toolResult;
  }

  /**
   * Streaming counterpart of sendMessage. Yields structured events (token
   * deltas, tool-call/tool-result notices, and a final done/error event) so
   * the controller can forward them as-is over SSE. Supports graceful
   * cancellation via `signal` - aborting it stops the upstream Gemini
   * request and ends the generator without persisting a partial reply.
   */
  async *stream(userId: string, userName: string | undefined, dto: SendMessageDto, signal?: AbortSignal): AsyncGenerator<AiStreamEvent> {
    let conversationId: string;
    try {
      conversationId = dto.conversationId ?? (await this.conversationsService.create(userId, { title: dto.content.slice(0, 60) })).id;
      await this.conversationsService.addMessage(userId, conversationId, { role: "user", content: dto.content, status: "complete" });
    } catch (error) {
      yield { type: "error", message: describeError(error) };
      return;
    }

    let settings: Awaited<ReturnType<UsersService["getAISettings"]>>;
    try {
      settings = await this.assertGeminiAvailable(userId);
    } catch (error) {
      yield { type: "error", message: describeError(error) };
      return;
    }

    const conversation = await this.conversationsService.findOne(userId, conversationId);
    const model = dto.model ?? (settings.model || undefined);
    const temperature = dto.temperature ?? settings.temperature;
    const maxTokens = dto.maxTokens ?? settings.maxTokens;

    let accumulated = "";
    let turnMessages: AiMessage[] = [];
    let turnUsage: AiTokenUsage | undefined;

    try {
      for (let iteration = 0; iteration < this.maxToolIterations; iteration++) {
        if (signal?.aborted) return;

        const baseMessages = this.promptManager.buildMessages(
          { userName, moduleHints: dto.moduleHints, toolsAvailable: true },
          this.historyFromConversation(conversation),
        );
        const messages = [...baseMessages, ...turnMessages];
        const tools = this.toolRegistry.getDefinitions();

        let iterationText = "";
        let toolCalls: AiToolCall[] | undefined;
        let iterationUsage: AiTokenUsage | undefined;
        const attemptStart = Date.now();

        try {
          for await (const chunk of this.gemini.stream({ messages, model, temperature, maxTokens, tools, signal })) {
            if (signal?.aborted) return;
            if (chunk.delta) {
              iterationText += chunk.delta;
              yield { type: "token", delta: chunk.delta };
            }
            if (chunk.done) {
              if (chunk.toolCalls?.length) toolCalls = chunk.toolCalls;
              if (chunk.usage) iterationUsage = chunk.usage;
            }
          }
        } catch (error) {
          const latencyMs = Date.now() - attemptStart;
          if (signal?.aborted) {
            this.logger.log(`AI stream turn cancelled: conversation=${conversationId} latencyMs=${latencyMs}`);
            return;
          }
          this.logger.warn(`AI stream turn failed: conversation=${conversationId} latencyMs=${latencyMs} error="${describeError(error)}"`);
          yield { type: "error", message: `Alien couldn't reach Gemini just now (${describeError(error)}). Please try again in a moment.` };
          return;
        }

        const latencyMs = Date.now() - attemptStart;
        turnUsage = addUsage(turnUsage, iterationUsage);
        this.logger.log(
          `AI stream turn succeeded: conversation=${conversationId} latencyMs=${latencyMs} ` +
            `promptTokens=${iterationUsage?.promptTokens ?? "n/a"} completionTokens=${iterationUsage?.completionTokens ?? "n/a"} ` +
            `totalTokens=${iterationUsage?.totalTokens ?? "n/a"}`,
        );

        if (toolCalls?.length) {
          turnMessages = [...turnMessages, { role: "assistant", content: iterationText, toolCalls }];
          for (const call of toolCalls) {
            yield { type: "tool_call", tool: call.name, args: call.arguments };
            const toolResult = await this.executeAndPersistTool(userId, conversationId, call, iterationText);
            yield { type: "tool_result", tool: call.name, success: toolResult.success, message: toolResult.message };
            turnMessages = [
              ...turnMessages,
              {
                role: "tool",
                content: JSON.stringify(toolResult.data ?? { message: toolResult.message }),
                toolCallId: call.id,
                name: call.name,
              },
            ];
          }
          continue;
        }

        accumulated = iterationText;
        break;
      }
    } catch (error) {
      this.logger.error(`Streaming turn failed for conversation ${conversationId}: ${describeError(error)}`);
      yield { type: "error", message: describeError(error) };
      return;
    }

    if (signal?.aborted) return;

    if (accumulated) {
      await this.conversationsService.addMessage(userId, conversationId, { role: "assistant", content: accumulated, status: "complete" });
    }

    this.logger.log(
      `AI stream turn complete: conversation=${conversationId} ` +
        `totalPromptTokens=${turnUsage?.promptTokens ?? "n/a"} totalCompletionTokens=${turnUsage?.completionTokens ?? "n/a"} ` +
        `totalTokens=${turnUsage?.totalTokens ?? "n/a"}`,
    );

    yield { type: "done", conversationId, usage: turnUsage };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Something went wrong while talking to Gemini.";
}
