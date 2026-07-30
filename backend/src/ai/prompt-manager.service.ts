import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AiMessage } from "./providers/ai-provider.interface";

export interface PromptContext {
  userName?: string;
  /** Free-form module context (e.g. "the person is viewing their Finance page"). */
  moduleHints?: string[];
  /** Whether the resolved provider actually supports tool calling (Ollama currently doesn't). */
  toolsAvailable?: boolean;
}

/**
 * Centralizes system-prompt construction and conversation-memory windowing
 * so every entry point (chat endpoint, streaming endpoint) builds prompts
 * the same way instead of hand-rolling strings inline.
 *
 * Memory design: for now, "memory" is the recent conversation history
 * (most recent `maxHistoryMessages`, trimmed from the oldest end) plus
 * lightweight profile/module context injected into the system prompt.
 * This is deliberately simple — the ChatMessage/Conversation persistence
 * model already stores everything, so a future phase can add semantic
 * search (e.g. embeddings over past conversations) purely as an additional
 * *retrieval* step feeding into `moduleHints`-like context, without
 * touching this class's public shape.
 */
@Injectable()
export class PromptManagerService {
  constructor(private readonly config: ConfigService) {}

  buildSystemPrompt(context: PromptContext): string {
    const lines = [
      "You are the Alien Assistant, the built-in AI copilot for AlienOS — a personal productivity OS covering tasks, notes, calendar, goals, finance, content planning, and workspace documents.",
      "Be concise, direct, and practical. Prefer concrete next steps over generic advice.",
    ];
    if (context.userName) lines.push(`The person you're helping is named ${context.userName}.`);
    if (context.moduleHints?.length) lines.push(`Relevant context: ${context.moduleHints.join("; ")}.`);
    if (context.toolsAvailable) {
      lines.push(
        "You can take real actions in AlienOS using the provided tools (creating/updating/deleting tasks, notes, goals, habits, calendar events, finance transactions, searching the workspace, reading dashboard stats, listing notifications). " +
          "Only call a tool when the person's request clearly calls for that action — don't call a tool just to check something you can answer from context. " +
          "When a tool call fails or needs disambiguation (e.g. an ambiguous account name), ask the person a short clarifying question instead of guessing.",
      );
    }
    return lines.join(" ");
  }

  /** Caps history to the most recent N messages (oldest ones dropped) so token usage stays bounded as a conversation grows. */
  private windowHistory(history: AiMessage[]): AiMessage[] {
    const max = this.config.get<number>("ai.maxHistoryMessages") ?? 24;
    if (history.length <= max) return history;
    return history.slice(history.length - max);
  }

  buildMessages(context: PromptContext, history: AiMessage[]): AiMessage[] {
    return [{ role: "system", content: this.buildSystemPrompt(context) }, ...this.windowHistory(history)];
  }
}
