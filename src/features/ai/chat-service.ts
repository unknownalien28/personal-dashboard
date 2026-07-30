import { useConversationsStore } from "@/features/ai/conversations-store";
import { useSettingsStore } from "@/features/profile/settings-store";
import { getProvider } from "@/features/ai/providers/registry";
import { buildContext, type ModuleKey } from "@/features/ai/context-engine";
import { parseActionBlock, stripActionBlock, stageAction, confirmAction, cancelAction } from "@/features/ai/action-protocol";
import type { ProviderMessage } from "@/features/ai/providers/types";
import type { ChatMessage } from "@/types/models";

/** One AbortController per in-flight assistant message, keyed by message id - not persisted, purely runtime. */
const activeStreams = new Map<string, AbortController>();

const ACTION_MARKER = "```alienos-action";

const SYSTEM_PROMPT = `You are Alien Assistant, the central intelligence layer of AlienOS - a personal productivity app with Tasks, Notes, Calendar, Goals, Finance, and Content Planner modules. Be concise, helpful, and friendly. Format responses in Markdown when useful (lists, code blocks, bold).

You may be given a "Workspace context" block below with real data from the modules relevant to the user's request - use it to ground your answer instead of guessing, and never mention data from a module that wasn't included in that context.

When the user's request requires *changing* something (creating, updating, completing, or deleting a task/note/event/goal/transaction), end your reply with exactly one fenced block in this exact form, on its own, after your normal answer:

${ACTION_MARKER}
{"tool": "<toolName>", "args": { ... }}
\`\`\`

Available tools: createTask({title, category?, priority?, dueDate?}), updateTask({id or title, ...fields}), completeTask({id or title}), deleteTask({id or title}), createNote({title?, content}), updateNote({id or title, ...fields}), deleteNote({id or title}), createEvent({title, description, startDate, endDate, startTime, endTime, allDay, color, category, location, reminder, repeat}), updateEvent({id or title, ...fields}), deleteEvent({id or title}), createGoal({title, description, category, priority, targetDate, status, color, icon, notes}), updateGoal({id or title, ...fields}), deleteGoal({id or title}), createTransaction({type, amount, category, accountId, ...}), deleteTransaction({id}), createContentPost({title, description?, body?, platform, hashtags?, mentions?, status?, priority?, category?, campaign?, tags?, publishDate?, publishTime?, notes?}), updateContentPost({id or title, ...fields}), deleteContentPost({id or title}).

Only include an action block when the user actually asked for a change - never invent one for a purely informational question. Delete* actions are never executed automatically; the app always asks the user to confirm first, so it's safe to propose them when asked.`;

function toProviderMessages(messages: ChatMessage[], contextText: string): ProviderMessage[] {
  const system: ProviderMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
  // Privacy: only sent to the provider when the context engine actually detected relevant modules.
  if (contextText) system.push({ role: "system", content: `Workspace context (only what's relevant to this request):\n\n${contextText}` });
  return [
    ...system,
    ...messages.filter((m) => m.status !== "error").map((m) => ({ role: m.role, content: m.content }) satisfies ProviderMessage),
  ];
}

/** Runs a provider request and streams/settles the result into the given assistant message. */
async function runAssistantReply(
  conversationId: string,
  assistantMessageId: string,
  history: ChatMessage[],
  forceModules: ModuleKey[] = []
) {
  const { updateMessage } = useConversationsStore.getState();
  const ai = useSettingsStore.getState().ai;
  const provider = getProvider(ai.provider);

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const { text: contextText } = buildContext(lastUserMessage?.content ?? "", forceModules);

  const controller = new AbortController();
  activeStreams.set(assistantMessageId, controller);
  updateMessage(conversationId, assistantMessageId, { status: "streaming", content: "" });

  try {
    let streamed = "";
    const full = await provider.send(
      {
        apiKey: ai.apiKey,
        model: ai.model,
        messages: toProviderMessages(history, contextText),
        temperature: ai.temperature,
        maxTokens: ai.maxTokens,
        stream: ai.streaming,
        signal: controller.signal,
      },
      ai.streaming
        ? (chunk) => {
            streamed += chunk;
            // Hide a still-forming action block while streaming rather than flashing raw JSON at the user.
            const markerIndex = streamed.indexOf(ACTION_MARKER);
            const displayable = markerIndex === -1 ? streamed : streamed.slice(0, markerIndex).trimEnd();
            updateMessage(conversationId, assistantMessageId, { content: displayable });
          }
        : undefined
    );

    const rawText = ai.streaming ? streamed || full : full;
    const parsedAction = parseActionBlock(rawText);
    const displayText = parsedAction ? stripActionBlock(rawText) : rawText;

    updateMessage(conversationId, assistantMessageId, {
      content: displayText,
      status: "complete",
      action: parsedAction ? stageAction(parsedAction) : undefined,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      updateMessage(conversationId, assistantMessageId, { status: "complete" });
    } else {
      updateMessage(conversationId, assistantMessageId, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Something went wrong reaching the AI provider.",
      });
    }
  } finally {
    activeStreams.delete(assistantMessageId);
  }
}

/** Sends a new user message and kicks off the assistant's reply. `forceModules` lets a caller (e.g. an "Ask Alien" button on the Finance page) guarantee that module's context is included even if the wording alone wouldn't trigger it. */
export async function sendUserMessage(conversationId: string, text: string, forceModules: ModuleKey[] = []): Promise<void> {
  const { addMessage } = useConversationsStore.getState();
  addMessage(conversationId, { role: "user", content: text, status: "complete" });

  const assistantId = addMessage(conversationId, { role: "assistant", content: "", status: "streaming" });
  const history = useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.messages ?? [];
  await runAssistantReply(conversationId, assistantId, history, forceModules);
}

/** Regenerates an assistant message: drops it and everything after it, then re-asks using the messages before it. */
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

/** Confirms a staged destructive action (delete*) and applies its result to the message. */
export function confirmPendingAction(conversationId: string, messageId: string): void {
  const message = useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.messages.find((m) => m.id === messageId);
  if (!message?.action) return;
  useConversationsStore.getState().updateMessage(conversationId, messageId, { action: confirmAction(message.action) });
}

/** Cancels a staged destructive action - nothing in the workspace changes. */
export function cancelPendingAction(conversationId: string, messageId: string): void {
  const message = useConversationsStore.getState().conversations.find((c) => c.id === conversationId)?.messages.find((m) => m.id === messageId);
  if (!message?.action) return;
  useConversationsStore.getState().updateMessage(conversationId, messageId, { action: cancelAction(message.action) });
}
