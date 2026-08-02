import { Injectable } from "@nestjs/common";
import { AiCompletionRequest, AiCompletionResult, AiProvider, AiStreamChunk } from "./ai-provider.interface";

/**
 * Always-available local provider. It never calls out to the network — it
 * deterministically echoes context so the rest of the stack (persistence,
 * streaming interface, controllers, tool-calling loop) can be built and
 * tested end-to-end even with zero AI provider API keys configured. Also
 * used as the automatic fallback when a user's preferred provider isn't
 * configured (see AiOrchestratorService.resolveProvider).
 */
@Injectable()
export class DemoAiProvider implements AiProvider {
  readonly key = "demo";

  isConfigured(): boolean {
    return true;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    return { content: this.canned(lastUserMessage?.content ?? ""), finishReason: "stop" };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const { content } = await this.complete(request);
    const words = content.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield { delta: (i === 0 ? "" : " ") + words[i], done: false };
    }
    yield { delta: "", done: true, finishReason: "stop" };
  }

  private canned(userText: string): string {
    if (!userText.trim()) {
      return "I'm the AlienOS demo assistant. Ask me about your tasks, notes, goals, or finances — this response is generated locally, no external AI provider is configured or was called.";
    }
    return `(demo provider) I heard: "${userText.trim()}". This reply is generated locally — no external AI provider is configured, so no external API was called.`;
  }
}
