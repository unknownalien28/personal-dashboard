import { api, streamSse, ApiError } from "@/lib/api/client";
import { useConversationsStore } from "@/features/ai/conversations-store";
import { useSettingsStore } from "@/features/profile/settings-store";
import { buildModuleHints, type ModuleKey } from "@/features/ai/context-engine";
import { buildMessageWithAttachments, type StagedUpload } from "@/features/ai/attachments";
import type { ChatAction, ChatMessage } from "@/types/models";

/**
 * Chat transport layer. This is the ONLY place in the frontend that talks
 * to AI — and it talks exclusively to AlienOS's own backend
 * (`/ai/messages` and `/ai/messages/stream`), never to Gemini directly.
 * The API key, prompt/context construction, conversation memory, and tool
 * execution all live server-side (see backend/src/ai/orchestrator.service.ts)
 * — this file just renders whatever the backend returns into the local
 * conversation store.
 */

/** One AbortController per in-flight assistant message, keyed by message id - not persisted, purely runtime. */
const activeStreams = new Map<string, AbortController>();

interface BackendChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "complete" | "streaming" | "error";
  createdAt: string;
}

interface SendMessageResponse {
  conversationId: string;
  message: BackendChatMessage;
  actions: Array<{ tool: string; args: Record<string, unknown>; status: "executed" | "failed"; resultMessage: string }>;
}

type StreamEvent =
  | { type: "token"; delta: string }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; success: boolean; message: string }
  | { type: "done"; conversationId: string }
  | { type: "error"; message: string };

function lastActionFrom(actions: SendMessageResponse["actions"]): ChatAction | undefined {
  const last = actions[actions.length - 1];
  if (!last) return undefined;
  return { tool: last.tool, args: last.args, status: last.status, resultMessage: last.resultMessage };
}

/** Resolves the id this conversation should be sent to the backend as — its established backendId once known, otherwise undefined (backend creates a fresh conversation and we adopt its id from the response). */
function backendConversationId(conversationId: string): string | undefined {
  return useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.backendId;
}

function adoptBackendId(conversationId: string, backendId: string): void {
  const existing = useConversationsStore.getState().conversations.find((c) => c.id === conversationId);
  if (existing && !existing.backendId) {
    useConversationsStore.getState().setBackendId(conversationId, backendId);
  }
}

/** Runs one backend turn (non-streaming) and settles the assistant message. */
async function runNonStreaming(
  conversationId: string,
  assistantMessageId: string,
  content: string,
  moduleHints: string[],
  signal: AbortSignal,
): Promise<void> {
  const { updateMessage } = useConversationsStore.getState();
  try {
    const response = await api.post<SendMessageResponse>(
      "/ai/messages",
      { conversationId: backendConversationId(conversationId), content, moduleHints },
      { signal },
    );
    adoptBackendId(conversationId, response.conversationId);

    updateMessage(conversationId, assistantMessageId, {
      content: response.message.content,
      status: "complete",
      action: lastActionFrom(response.actions),
    });
  } catch (err) {
    if (signal.aborted) {
      // Stop was pressed. The backend has no partial text to show for a
      // non-streaming turn (it's one request/response, not incremental), so
      // there's nothing to keep - just exit the loading state cleanly.
      updateMessage(conversationId, assistantMessageId, { status: "complete" });
      return;
    }
    updateMessage(conversationId, assistantMessageId, {
      status: "error",
      errorMessage: err instanceof ApiError ? err.message : "Something went wrong reaching Alien.",
    });
  }
}

/** Runs one backend turn via Server-Sent Events, streaming tokens into the assistant message as they arrive. */
async function runStreaming(
  conversationId: string,
  assistantMessageId: string,
  content: string,
  moduleHints: string[],
  signal: AbortSignal,
): Promise<void> {
  const { updateMessage } = useConversationsStore.getState();
  let streamed = "";
  let pendingToolCall: { tool: string; args: Record<string, unknown> } | undefined;
  let lastAction: ChatAction | undefined;

  try {
    for await (const event of streamSse<StreamEvent>(
      "/ai/messages/stream",
      { conversationId: backendConversationId(conversationId), content, moduleHints },
      { signal },
    )) {
      if (event.type === "token") {
        streamed += event.delta;
        updateMessage(conversationId, assistantMessageId, { content: streamed });
      } else if (event.type === "tool_call") {
        pendingToolCall = { tool: event.tool, args: event.args };
      } else if (event.type === "tool_result") {
        lastAction = {
          tool: pendingToolCall?.tool ?? event.tool,
          args: pendingToolCall?.args ?? {},
          status: event.success ? "executed" : "failed",
          resultMessage: event.message,
        };
        updateMessage(conversationId, assistantMessageId, { action: lastAction });
      } else if (event.type === "done") {
        adoptBackendId(conversationId, event.conversationId);
        updateMessage(conversationId, assistantMessageId, { content: streamed, status: "complete" });
      } else if (event.type === "error") {
        updateMessage(conversationId, assistantMessageId, { status: "error", errorMessage: event.message });
      }
    }
  } catch (err) {
    if (signal.aborted) {
      updateMessage(conversationId, assistantMessageId, { status: "complete" });
    } else {
      updateMessage(conversationId, assistantMessageId, {
        status: "error",
        errorMessage: err instanceof ApiError ? err.message : "Something went wrong reaching Alien.",
      });
    }
  }
}

/** Runs a backend request and streams/settles the result into the given assistant message. */
async function runAssistantReply(
  conversationId: string,
  assistantMessageId: string,
  history: ChatMessage[],
  forceModules: ModuleKey[] = [],
): Promise<void> {
  const { updateMessage } = useConversationsStore.getState();
  const { ai } = useSettingsStore.getState();

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const content = lastUserMessage?.content ?? "";
  const { hints } = buildModuleHints(content, forceModules);

  updateMessage(conversationId, assistantMessageId, { status: "streaming", content: "" });

  if (!ai.enabled) {
    updateMessage(conversationId, assistantMessageId, {
      status: "error",
      errorMessage: "AI is turned off in your settings. Enable it under Settings > AI to chat with Alien.",
    });
    return;
  }

  const controller = new AbortController();
  activeStreams.set(assistantMessageId, controller);
  try {
    if (ai.streaming) {
      await runStreaming(conversationId, assistantMessageId, content, hints, controller.signal);
    } else {
      await runNonStreaming(conversationId, assistantMessageId, content, hints, controller.signal);
    }
  } finally {
    activeStreams.delete(assistantMessageId);
  }
}

/** Sends a new user message and kicks off the assistant's reply. `forceModules` lets a caller (e.g. an "Ask Alien" button on the Finance page) guarantee that page's context is flagged to the backend even if the wording alone wouldn't trigger it. `uploads` are files already uploaded via ChatInput's file picker/drag-and-drop. */
export async function sendUserMessage(
  conversationId: string,
  text: string,
  forceModules: ModuleKey[] = [],
  uploads: StagedUpload[] = [],
): Promise<void> {
  const { addMessage } = useConversationsStore.getState();
  // Stored content includes any inlined file text (see buildMessageWithAttachments) -
  // this is what actually gets sent to the AI, and what gets re-sent verbatim on
  // retry/regenerate. MessageBubble strips the inlined blocks back out for display
  // via stripAttachmentBlocks(), showing the attachment chips instead.
  const contentForAi = buildMessageWithAttachments(text, uploads);
  addMessage(conversationId, {
    role: "user",
    content: contentForAi,
    status: "complete",
    attachments: uploads.map((u) => u.attachment),
  });

  const assistantId = addMessage(conversationId, { role: "assistant", content: "", status: "streaming" });
  const history = useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.messages ?? [];
  await runAssistantReply(conversationId, assistantId, history, forceModules);
}

/**
 * Regenerates an assistant message: drops it and everything after it, then
 * re-asks using the last user message. Note: since the backend persists
 * conversation history itself, this re-sends that user message as a new
 * turn rather than truly "replaying" the exact same backend turn — the
 * backend conversation log will show the question asked twice. This is a
 * minor, disclosed trade-off of keeping the backend's chat API simple
 * (add-message-and-reply) rather than adding a dedicated regenerate
 * endpoint.
 */
export async function regenerateMessage(conversationId: string, assistantMessageId: string): Promise<void> {
  const { truncateFrom, addMessage } = useConversationsStore.getState();
  truncateFrom(conversationId, assistantMessageId);
  const history = useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.messages ?? [];
  const newAssistantId = addMessage(conversationId, { role: "assistant", content: "", status: "streaming" });
  await runAssistantReply(conversationId, newAssistantId, history);
}

/** Retries a failed assistant message in place, reusing the same message id. */
export async function retryMessage(conversationId: string, assistantMessageId: string): Promise<void> {
  const conversation = useConversationsStore.getState().conversations.find((c) => c.id === conversationId);
  if (!conversation) return;
  const idx = conversation.messages.findIndex((m) => m.id === assistantMessageId);
  const history = idx === -1 ? conversation.messages : conversation.messages.slice(0, idx);
  await runAssistantReply(conversationId, assistantMessageId, history);
}

/** Stops an in-flight streaming response, keeping whatever text has arrived so far. */
export function stopGenerating(assistantMessageId: string): void {
  activeStreams.get(assistantMessageId)?.abort();
}

export function isGenerating(assistantMessageId: string): boolean {
  return activeStreams.has(assistantMessageId);
}

/**
 * Destructive tool calls (delete task/goal, etc.) are executed immediately
 * by the backend's AI orchestration layer, the same way every other tool
 * is — there is no client-side "pending confirmation" stage anymore (an
 * earlier, fully client-side prototype staged deletes for confirmation;
 * seeing/confirming after the fact is no longer meaningful once execution
 * has moved server-side). These are kept as no-op-safe stubs so any
 * lingering UI wiring doesn't throw; they're no longer expected to be
 * called since no message ever arrives with status "pending" now.
 */
export function confirmPendingAction(_conversationId: string, _messageId: string): void {
  // Intentionally a no-op — see doc comment above.
}

export function cancelPendingAction(_conversationId: string, _messageId: string): void {
  // Intentionally a no-op — see doc comment above.
}
