import { Injectable } from "@nestjs/common";
import { AiCompletionChunk, AiCompletionRequest, AiProvider } from "./ai-provider.interface";

/**
 * The only "real" provider wired up in Phase 9. It never calls out to the
 * network — it deterministically echoes context so the rest of the stack
 * (persistence, streaming interface, controllers) can be built and tested
 * end-to-end before any real model integration lands.
 */
@Injectable()
export class DemoAiProvider implements AiProvider {
  readonly key = "demo";

  async complete(request: AiCompletionRequest): Promise<string> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    return this.canned(lastUserMessage?.content ?? "");
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiCompletionChunk> {
    const full = await this.complete(request);
    const words = full.split(" ");
    for (let i = 0; i < words.length; i++) {
      yield { delta: (i === 0 ? "" : " ") + words[i], done: false };
    }
    yield { delta: "", done: true };
  }

  private canned(userText: string): string {
    if (!userText.trim()) {
      return "I'm the AlienOS demo assistant. Ask me about your tasks, notes, goals, or finances and I'll help once a real provider is connected.";
    }
    return `(demo provider) I heard: "${userText.trim()}". Real AI providers aren't wired up yet — this response is generated locally so the rest of AlienOS can be built against a stable interface.`;
  }
}
