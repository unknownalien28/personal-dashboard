import { ForbiddenException, ServiceUnavailableException } from "@nestjs/common";
import { AiOrchestratorService } from "./orchestrator.service";
import { GeminiProvider } from "./providers/gemini.provider";

function makeFakeGemini(overrides: Partial<GeminiProvider> = {}): GeminiProvider {
  return {
    isConfigured: () => true,
    complete: async () => ({ content: "a reply", finishReason: "stop" as const }),
    stream: async function* () {
      yield { delta: "a reply", done: false };
      yield { delta: "", done: true, finishReason: "stop" as const };
    },
    ...overrides,
  } as GeminiProvider;
}

function buildOrchestrator(gemini: GeminiProvider, aiEnabled = true) {
  const conv = { id: "conv-1", messages: [] as any[] };
  const fakeConversationsService = {
    create: async () => ({ id: "conv-1" }),
    findOne: async () => conv,
    addMessage: async (_userId: string, conversationId: string, msg: any) => {
      const m = { id: `msg-${conv.messages.length}`, conversationId, ...msg, createdAt: new Date().toISOString() };
      conv.messages.push(m);
      return m;
    },
  };
  const fakeUsersService = {
    getAISettings: async () => ({ enabled: aiEnabled, model: "", temperature: 0.7, maxTokens: 1024 }),
  };
  const fakeToolRegistry = { getDefinitions: () => [], execute: async () => ({ success: true, message: "n/a" }) };
  const fakePromptManager = { buildMessages: (_ctx: any, history: any[]) => [{ role: "system", content: "sys" }, ...history] };
  const fakeConfig = { get: (key: string) => (key === "ai.maxToolIterations" ? 4 : undefined) };

  return new AiOrchestratorService(
    gemini,
    fakePromptManager as any,
    fakeConversationsService as any,
    fakeUsersService as any,
    fakeToolRegistry as any,
    fakeConfig as any,
  );
}

describe("AiOrchestratorService (single-provider architecture)", () => {
  describe("sendMessage", () => {
    it("answers via Gemini directly - no provider selection involved", async () => {
      const gemini = makeFakeGemini({ complete: async () => ({ content: "Hello there!", finishReason: "stop" as const }) });
      const orchestrator = buildOrchestrator(gemini);

      const result = await orchestrator.sendMessage("user-1", "Alien", { content: "Hello" } as any);

      expect(result.message.content).toBe("Hello there!");
      expect(result).not.toHaveProperty("provider");
      expect(result).not.toHaveProperty("fallbackNote");
    });

    it("throws ForbiddenException when AI is disabled in settings, without ever calling Gemini", async () => {
      let called = false;
      const gemini = makeFakeGemini({ complete: async () => { called = true; return { content: "x", finishReason: "stop" as const }; } });
      const orchestrator = buildOrchestrator(gemini, false);

      await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(ForbiddenException);
      expect(called).toBe(false);
    });

    it("throws ServiceUnavailableException with a clear message when Gemini isn't configured (no API key) - never falls back to anything else", async () => {
      const gemini = makeFakeGemini({ isConfigured: () => false });
      const orchestrator = buildOrchestrator(gemini);

      await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(ServiceUnavailableException);
      await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(/isn't configured/i);
    });

    it("throws ServiceUnavailableException (not a fabricated response) when Gemini's request genuinely fails", async () => {
      const gemini = makeFakeGemini({
        complete: async () => {
          throw new Error("upstream 500");
        },
      });
      const orchestrator = buildOrchestrator(gemini);

      await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(ServiceUnavailableException);
      await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(/upstream 500/);
    });

    it("does not throw when the request is aborted - settles with a cancellation message instead", async () => {
      const gemini = makeFakeGemini({
        complete: async (request: any) =>
          new Promise((_resolve, reject) => {
            request.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          }),
      });
      const orchestrator = buildOrchestrator(gemini);
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5);

      const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any, controller.signal);
      expect(result.message.content).toBe("Request cancelled.");
    });

    it("runs the tool-calling loop across multiple iterations and sums token usage", async () => {
      let callCount = 0;
      const gemini = makeFakeGemini({
        complete: async () => {
          callCount++;
          if (callCount === 1) {
            return {
              content: "",
              finishReason: "tool_calls" as const,
              toolCalls: [{ id: "call-1", name: "create_task", arguments: { title: "test" } }],
              usage: { promptTokens: 20, completionTokens: 5, totalTokens: 25 },
            };
          }
          return { content: "Done!", finishReason: "stop" as const, usage: { promptTokens: 30, completionTokens: 8, totalTokens: 38 } };
        },
      });
      const orchestrator = buildOrchestrator(gemini);

      const result = await orchestrator.sendMessage("user-1", "Alien", { content: "create a task" } as any);

      expect(result.message.content).toBe("Done!");
      expect(result.actions).toHaveLength(1);
      expect(result.usage).toEqual({ promptTokens: 50, completionTokens: 13, totalTokens: 63 });
    });
  });

  describe("stream", () => {
    it("yields token events, then a done event, with usage - no provider field on either", async () => {
      const gemini = makeFakeGemini({
        stream: async function* () {
          yield { delta: "Hello", done: false };
          yield { delta: ", world!", done: false };
          yield { delta: "", done: true, finishReason: "stop" as const, usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 } };
        },
      });
      const orchestrator = buildOrchestrator(gemini);

      const events: any[] = [];
      for await (const event of orchestrator.stream("user-1", "Alien", { content: "hi" } as any)) {
        events.push(event);
      }

      expect(events.filter((e) => e.type === "token").map((e) => e.delta)).toEqual(["Hello", ", world!"]);
      const doneEvent = events.find((e) => e.type === "done");
      expect(doneEvent).toBeDefined();
      expect(doneEvent.usage).toEqual({ promptTokens: 5, completionTokens: 3, totalTokens: 8 });
      expect(doneEvent).not.toHaveProperty("provider");
      expect(doneEvent).not.toHaveProperty("fallbackNote");
    });

    it("yields an error event (not a fabricated response) when Gemini isn't configured", async () => {
      const gemini = makeFakeGemini({ isConfigured: () => false });
      const orchestrator = buildOrchestrator(gemini);

      const events: any[] = [];
      for await (const event of orchestrator.stream("user-1", "Alien", { content: "hi" } as any)) {
        events.push(event);
      }

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("error");
      expect(events[0].message).toMatch(/isn't configured/i);
    });

    it("yields an error event when Gemini's stream genuinely fails mid-response", async () => {
      const gemini = makeFakeGemini({
        stream: async function* () {
          yield { delta: "partial", done: false };
          throw new Error("connection reset");
        },
      });
      const orchestrator = buildOrchestrator(gemini);

      const events: any[] = [];
      for await (const event of orchestrator.stream("user-1", "Alien", { content: "hi" } as any)) {
        events.push(event);
      }

      expect(events[0]).toEqual({ type: "token", delta: "partial" });
      expect(events[1].type).toBe("error");
      expect(events[1].message).toMatch(/connection reset/);
    });

    it("stops cleanly (no error event) when aborted mid-stream", async () => {
      const gemini = makeFakeGemini({
        stream: async function* (request: any) {
          yield { delta: "partial", done: false };
          await new Promise((_resolve, reject) => {
            request.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          });
        },
      });
      const orchestrator = buildOrchestrator(gemini);
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 20);

      const events: any[] = [];
      for await (const event of orchestrator.stream("user-1", "Alien", { content: "hi" } as any, controller.signal)) {
        events.push(event);
      }

      expect(events).toEqual([{ type: "token", delta: "partial" }]);
    });
  });

  describe("getStatus", () => {
    it("reports Gemini's configuration status", () => {
      const orchestrator = buildOrchestrator(makeFakeGemini({ isConfigured: () => true }));
      expect(orchestrator.getStatus()).toEqual({ provider: "gemini", configured: true });
    });

    it("reports not configured when the API key is missing", () => {
      const orchestrator = buildOrchestrator(makeFakeGemini({ isConfigured: () => false }));
      expect(orchestrator.getStatus()).toEqual({ provider: "gemini", configured: false });
    });
  });
});
