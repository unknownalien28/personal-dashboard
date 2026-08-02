import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConversationsService } from "../conversations/conversations.service";
import { UsersService } from "../users/users.service";
import { AiMessage, AiProvider, AiTokenUsage, AiToolCall } from "./providers/ai-provider.interface";
import { AiProviderRegistry } from "./providers/registry";
import { ProviderHealthService } from "./providers/provider-health.service";
import { PromptManagerService } from "./prompt-manager.service";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { SendMessageDto } from "./dto/ai.schemas";

/**
 * "auto" provider priority — the hybrid architecture's default mode.
 * Gemini (cloud, primary) first, then Ollama (local/offline, always
 * "configured" out of the box at http://localhost:11434), then the
 * remaining cloud providers, ending at the always-available local demo
 * provider so a reply is never impossible.
 */
const AUTO_PRIORITY_CHAIN = ["gemini", "ollama", "openai", "anthropic", "demo"] as const;

/** Providers whose integration here doesn't support tool calling. Currently empty — Gemini, OpenAI, Anthropic, and Ollama all support it; kept for forward-compatibility with any future text-only provider. */
const TOOL_CALLING_UNSUPPORTED = new Set<string>([]);

/** Fields consumed from a persisted ChatMessage row — typed locally so this file doesn't depend on the generated Prisma client shape lining up exactly. */
interface ChatMessageRow {
  role: string;
  content: string;
  actionTool: string | null;
  actionStatus: string | null;
  actionResult: string | null;
}

export interface ResolvedProvider {
  provider: AiProvider;
  settings: Awaited<ReturnType<UsersService["getAISettings"]>>;
  fallbackNote?: string;
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
  provider: string;
  fallbackNote?: string;
  actions: ToolActionSummary[];
  /** Token usage for this turn. When a turn involves multiple tool-calling iterations (more than one provider call), this is the sum across all of them - the true cost of the turn, not just the final reply. */
  usage?: AiTokenUsage;
}

export type AiStreamEvent =
  | { type: "token"; delta: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; success: boolean; message: string }
  | { type: "done"; conversationId: string; provider: string; fallbackNote?: string; usage?: AiTokenUsage }
  | { type: "error"; message: string };

/** Sums token usage across multiple provider calls within a single turn (tool-calling iterations each invoke a provider again). Fields present on either side are added; a field absent on both stays absent rather than becoming 0, so "no data available" is distinguishable from "used zero tokens". */
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
 * The AI orchestration layer: the single place that decides which provider
 * answers a message, builds the prompt/context, drives the tool-calling
 * loop, persists conversation memory, and produces a provider-agnostic
 * result — so the controller (and the frontend) never needs to know or
 * care whether Gemini, Ollama, OpenAI, Anthropic, or the local demo
 * provider ultimately handled the request.
 *
 * Hybrid fallback model:
 *  - Provider SELECTION (before any network call) picks a candidate chain:
 *    the user's explicit choice (if not "auto") first, then the "auto"
 *    priority chain (Gemini -> Ollama -> OpenAI -> Anthropic -> Demo),
 *    skipping providers that aren't configured at all.
 *  - Provider EXECUTION tries each candidate in order and only moves to
 *    the next one if the current one actually throws (missing key,
 *    network error, upstream 5xx after retries, timeout, etc) — so
 *    "Gemini unavailable/disabled/erroring -> fall back to Ollama -> fall
 *    back further" happens automatically and transparently to the caller.
 *  - Once a provider has successfully started answering a turn (i.e. once
 *    any tool has been executed, or — for streaming — once any token has
 *    been sent to the client), we commit to that provider for the rest of
 *    the turn. Switching providers after side effects have already
 *    started (tool calls) or after partial output has already reached the
 *    user would be unsafe/confusing, so at that point a failure surfaces
 *    as a normal error instead of silently retrying elsewhere.
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly providers: AiProviderRegistry,
    private readonly promptManager: PromptManagerService,
    private readonly conversationsService: ConversationsService,
    private readonly usersService: UsersService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly config: ConfigService,
    private readonly health: ProviderHealthService,
  ) {}

  private get maxToolIterations(): number {
    return this.config.get<number>("ai.maxToolIterations") ?? 4;
  }

  /** Configured status (from the registry) merged with live health status (from ProviderHealthService) - used by GET /ai/providers. */
  listProviders() {
    return this.providers.listWithStatus().map((p) => ({ ...p, ...this.health.getStatus(p.key) }));
  }

  listTools() {
    return this.toolRegistry.getDefinitions();
  }

  /**
   * Builds the ordered list of configured providers to try for this turn.
   * An explicit (non-"auto") selection is tried first, then the rest of
   * the auto priority chain as a safety net, always ending at "demo".
   */
  private buildCandidateChain(desiredKey: string): AiProvider[] {
    const seen = new Set<string>();
    const candidates: AiProvider[] = [];

    const tryAdd = (key: string) => {
      if (seen.has(key)) return;
      seen.add(key);
      const provider = this.providers.tryResolveConfigured(key);
      if (provider) candidates.push(provider);
    };

    if (desiredKey !== "auto") tryAdd(desiredKey);
    for (const key of AUTO_PRIORITY_CHAIN) tryAdd(key);

    // "demo" is always configured, so this is unreachable in practice —
    // kept as a hard guarantee that a reply is always possible.
    if (candidates.length === 0) candidates.push(this.providers.resolve("demo"));

    // Stable partition: healthy candidates first (in their original
    // priority order), currently-unhealthy ones moved to the end (also in
    // their original relative order) rather than dropped - see
    // ProviderHealthService's class doc comment for why this isn't a hard
    // circuit breaker.
    const healthy = candidates.filter((c) => this.health.isHealthy(c.key));
    const unhealthy = candidates.filter((c) => !this.health.isHealthy(c.key));
    return [...healthy, ...unhealthy];
  }

  /**
   * Resolves the user's AI settings and the provider candidate chain for
   * this turn, without making any network calls yet. Throws if the user
   * has AI disabled in Settings.
   */
  private async prepareCandidates(userId: string, requestedKey?: string) {
    const settings = await this.usersService.getAISettings(userId);
    if (settings.enabled === false) {
      throw new ForbiddenException("AI is turned off in your settings. Enable it under Settings > AI to chat with Alien.");
    }

    const desiredKey = requestedKey ?? settings.provider ?? "auto";
    const candidates = this.buildCandidateChain(desiredKey);
    return { settings, desiredKey, candidates };
  }

  /** Convenience used by GET-style callers that just want "the provider that would answer right now" without running a turn. */
  async resolveProvider(userId: string, requestedKey?: string): Promise<ResolvedProvider> {
    const { settings, desiredKey, candidates } = await this.prepareCandidates(userId, requestedKey);
    const provider = candidates[0];
    const fallbackNote =
      provider.key !== desiredKey && desiredKey !== "auto"
        ? `"${desiredKey}" isn't configured (missing API key) — used "${provider.key}" instead.`
        : undefined;
    return { provider, settings, fallbackNote };
  }

  /**
   * Converts persisted ChatMessage rows into provider-agnostic AiMessage
   * history. Tool actions are folded into a short text summary rather than
   * replayed as literal tool_call/tool_result blocks — this keeps stored
   * conversation memory portable across providers (which don't share a
   * tool-call wire format) and stable even if the tool-calling schema
   * changes in a future phase.
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

  private supportsTools(provider: AiProvider): boolean {
    return !TOOL_CALLING_UNSUPPORTED.has(provider.key);
  }

  async sendMessage(userId: string, userName: string | undefined, dto: SendMessageDto, signal?: AbortSignal): Promise<SendMessageResult> {
    const conversationId =
      dto.conversationId ?? (await this.conversationsService.create(userId, { title: dto.content.slice(0, 60) })).id;

    await this.conversationsService.addMessage(userId, conversationId, { role: "user", content: dto.content, status: "complete" });

    const { settings, desiredKey, candidates } = await this.prepareCandidates(userId, dto.provider);
    const conversation = await this.conversationsService.findOne(userId, conversationId);

    const model = dto.model ?? (settings.model || undefined);
    const temperature = dto.temperature ?? settings.temperature;
    const maxTokens = dto.maxTokens ?? settings.maxTokens;

    let finalText = "";
    let activeProvider: AiProvider | undefined;
    const attemptNotes: string[] = [];
    const actions: ToolActionSummary[] = [];
    let turnMessages: AiMessage[] = [];
    let turnUsage: AiTokenUsage | undefined;

    for (let iteration = 0; iteration < this.maxToolIterations; iteration++) {
      if (signal?.aborted) {
        finalText = "Request cancelled.";
        break;
      }
      const toolsAvailable = activeProvider ? this.supportsTools(activeProvider) : true;
      const baseMessages = this.promptManager.buildMessages(
        { userName, moduleHints: dto.moduleHints, toolsAvailable },
        this.historyFromConversation(conversation),
      );
      // Re-apply any tool round-trips accumulated so far this turn.
      const messages = [...baseMessages, ...turnMessages];

      const tools = toolsAvailable ? this.toolRegistry.getDefinitions() : undefined;
      const candidatesToTry = activeProvider ? [activeProvider] : candidates;

      let result: Awaited<ReturnType<AiProvider["complete"]>> | undefined;
      for (const candidate of candidatesToTry) {
        const attemptStart = Date.now();
        try {
          result = await candidate.complete({
            messages,
            model,
            temperature,
            maxTokens,
            tools: this.supportsTools(candidate) ? tools : undefined,
            signal,
          });
          const latencyMs = Date.now() - attemptStart;
          this.health.recordSuccess(candidate.key);
          turnUsage = addUsage(turnUsage, result.usage);
          this.logger.log(
            `AI turn succeeded: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs} ` +
              `promptTokens=${result.usage?.promptTokens ?? "n/a"} completionTokens=${result.usage?.completionTokens ?? "n/a"} ` +
              `totalTokens=${result.usage?.totalTokens ?? "n/a"} finishReason=${result.finishReason}`,
          );
          if (!activeProvider) {
            activeProvider = candidate;
            if (candidate.key !== desiredKey) {
              attemptNotes.push(
                desiredKey === "auto"
                  ? `Auto mode selected "${candidate.key}".`
                  : `"${desiredKey}" wasn't available — used "${candidate.key}" instead.`,
              );
              this.logger.log(
                `AI fallback decision: conversation=${conversationId} desired="${desiredKey}" selected="${candidate.key}" reason=auto-routing`,
              );
            }
          }
          break;
        } catch (error) {
          const latencyMs = Date.now() - attemptStart;
          if (signal?.aborted) {
            // The person clicked Stop (or disconnected) - the resulting
            // rejection is expected and says nothing about this provider's
            // health. Recording it as a failure would incorrectly
            // deprioritize (and after 3 stops, effectively disable for 30s)
            // a perfectly healthy provider just because someone cancelled a
            // request, silently pushing later unrelated turns onto Ollama/
            // Demo. Stop trying further candidates too - nobody's waiting.
            this.logger.log(`AI turn cancelled: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs}`);
            break;
          }
          this.health.recordFailure(candidate.key);
          this.logger.warn(
            `AI turn failed: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs} error="${describeError(error)}"`,
          );
          attemptNotes.push(`"${candidate.key}" failed (${describeError(error)}).`);
        }
      }

      if (signal?.aborted) {
        finalText = "Request cancelled.";
        break;
      }

      if (!result) {
        finalText = "I'm having trouble reaching every configured AI provider right now — please try again shortly.";
        break;
      }

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
      `AI turn complete: conversation=${conversationId} provider="${(activeProvider ?? candidates[0]).key}" ` +
        `totalPromptTokens=${turnUsage?.promptTokens ?? "n/a"} totalCompletionTokens=${turnUsage?.completionTokens ?? "n/a"} ` +
        `totalTokens=${turnUsage?.totalTokens ?? "n/a"} actionsCount=${actions.length}`,
    );

    return {
      conversationId,
      message: assistantMessage,
      provider: (activeProvider ?? candidates[0]).key,
      fallbackNote: attemptNotes.length ? attemptNotes.join(" ") : undefined,
      actions,
      usage: turnUsage,
    };
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
   * cancellation via `signal` — aborting it stops the upstream provider
   * request and ends the generator without persisting a partial reply.
   *
   * Provider fallback applies per-iteration only up until the first token
   * of that iteration has been yielded to the client — once real output
   * has been streamed out, we can't cleanly retry on a different provider
   * without showing the user a confusing mix of two replies, so a failure
   * past that point ends the turn with an error event instead.
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

    let prepared: Awaited<ReturnType<AiOrchestratorService["prepareCandidates"]>>;
    try {
      prepared = await this.prepareCandidates(userId, dto.provider);
    } catch (error) {
      yield { type: "error", message: describeError(error) };
      return;
    }
    const { settings, desiredKey, candidates } = prepared;

    const conversation = await this.conversationsService.findOne(userId, conversationId);
    const model = dto.model ?? (settings.model || undefined);
    const temperature = dto.temperature ?? settings.temperature;
    const maxTokens = dto.maxTokens ?? settings.maxTokens;

    let accumulated = "";
    let activeProvider: AiProvider | undefined;
    let turnMessages: AiMessage[] = [];
    let turnUsage: AiTokenUsage | undefined;

    try {
      for (let iteration = 0; iteration < this.maxToolIterations; iteration++) {
        if (signal?.aborted) return;

        const toolsAvailable = activeProvider ? this.supportsTools(activeProvider) : true;
        const baseMessages = this.promptManager.buildMessages(
          { userName, moduleHints: dto.moduleHints, toolsAvailable },
          this.historyFromConversation(conversation),
        );
        const messages = [...baseMessages, ...turnMessages];
        const tools = toolsAvailable ? this.toolRegistry.getDefinitions() : undefined;
        const candidatesToTry = activeProvider ? [activeProvider] : candidates;

        let iterationText = "";
        let toolCalls: AiToolCall[] | undefined;
        let iterationUsage: AiTokenUsage | undefined;
        let succeeded = false;

        for (const candidate of candidatesToTry) {
          let yieldedAny = false;
          const attemptStart = Date.now();
          try {
            for await (const chunk of candidate.stream({
              messages,
              model,
              temperature,
              maxTokens,
              tools: this.supportsTools(candidate) ? tools : undefined,
              signal,
            })) {
              if (signal?.aborted) return;
              if (chunk.delta) {
                iterationText += chunk.delta;
                yieldedAny = true;
                yield { type: "token", delta: chunk.delta };
              }
              if (chunk.done) {
                if (chunk.toolCalls?.length) toolCalls = chunk.toolCalls;
                if (chunk.usage) iterationUsage = chunk.usage;
              }
            }
            const latencyMs = Date.now() - attemptStart;
            activeProvider = candidate;
            succeeded = true;
            this.health.recordSuccess(candidate.key);
            turnUsage = addUsage(turnUsage, iterationUsage);
            this.logger.log(
              `AI stream turn succeeded: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs} ` +
                `promptTokens=${iterationUsage?.promptTokens ?? "n/a"} completionTokens=${iterationUsage?.completionTokens ?? "n/a"} ` +
                `totalTokens=${iterationUsage?.totalTokens ?? "n/a"}`,
            );
            if (candidate.key !== desiredKey && iteration === 0) {
              this.logger.log(
                `AI fallback decision: conversation=${conversationId} desired="${desiredKey}" selected="${candidate.key}" reason=auto-routing`,
              );
            }
            break;
          } catch (error) {
            const latencyMs = Date.now() - attemptStart;
            if (signal?.aborted) {
              // The person clicked Stop mid-stream (or disconnected). This is
              // not a provider failure - recording it as one would
              // incorrectly deprioritize a healthy provider after a few
              // Stop-button clicks, silently pushing later unrelated turns
              // onto Ollama/Demo. Just stop; the frontend already knows the
              // request was cancelled from its own end of the same signal.
              this.logger.log(`AI stream turn cancelled: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs}`);
              return;
            }
            this.health.recordFailure(candidate.key);
            this.logger.warn(
              `AI stream turn failed: provider="${candidate.key}" conversation=${conversationId} latencyMs=${latencyMs} error="${describeError(error)}"`,
            );
            if (yieldedAny) {
              // Already streamed partial output to the client on this provider — can't safely retry elsewhere.
              yield { type: "error", message: `Lost connection to "${candidate.key}" mid-response: ${describeError(error)}` };
              return;
            }
            // Nothing shown yet — safe to try the next candidate.
          }
        }

        if (!succeeded) {
          yield { type: "error", message: "Every configured AI provider failed to respond — please try again shortly." };
          return;
        }

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

    const fallbackNote =
      activeProvider && activeProvider.key !== desiredKey
        ? desiredKey === "auto"
          ? `Auto mode selected "${activeProvider.key}".`
          : `"${desiredKey}" wasn't available — used "${activeProvider.key}" instead.`
        : undefined;

    this.logger.log(
      `AI stream turn complete: conversation=${conversationId} provider="${(activeProvider ?? candidates[0]).key}" ` +
        `totalPromptTokens=${turnUsage?.promptTokens ?? "n/a"} totalCompletionTokens=${turnUsage?.completionTokens ?? "n/a"} ` +
        `totalTokens=${turnUsage?.totalTokens ?? "n/a"}`,
    );

    yield { type: "done", conversationId, provider: (activeProvider ?? candidates[0]).key, fallbackNote, usage: turnUsage };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Something went wrong while talking to the AI provider.";
}
