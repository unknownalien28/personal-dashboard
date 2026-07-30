import { Injectable } from "@nestjs/common";
import { AiMessage } from "./providers/ai-provider.interface";

export interface PromptContext {
  userName?: string;
  /** Free-form module context (e.g. "the person is viewing their Finance page"). */
  moduleHints?: string[];
}

/**
 * Centralizes system-prompt construction so every entry point (chat
 * endpoint, future tool-calling, future streaming) builds prompts the same
 * way instead of hand-rolling strings inline.
 */
@Injectable()
export class PromptManagerService {
  buildSystemPrompt(context: PromptContext): string {
    const lines = [
      "You are the Alien Assistant, the built-in AI copilot for AlienOS — a personal productivity OS covering tasks, notes, calendar, goals, finance, content planning, and workspace documents.",
      "Be concise, direct, and practical. Prefer concrete next steps over generic advice.",
    ];
    if (context.userName) lines.push(`The person you're helping is named ${context.userName}.`);
    if (context.moduleHints?.length) lines.push(`Relevant context: ${context.moduleHints.join("; ")}.`);
    return lines.join(" ");
  }

  buildMessages(context: PromptContext, history: AiMessage[]): AiMessage[] {
    return [{ role: "system", content: this.buildSystemPrompt(context) }, ...history];
  }
}
