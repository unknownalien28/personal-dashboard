import { AiOrchestratorService } from "./orchestrator.service";
import { AiProviderRegistry } from "./providers/registry";
import { ProviderHealthService } from "./providers/provider-health.service";
import type { AiProvider } from "./providers/ai-provider.interface";

function makeFailingProvider(key: string, status: number, message = "provider failed"): AiProvider {
  return {
    key,
    isConfigured: () => true,
    complete: async () => {
      const err: any = new Error(message);
      err.status = status;
      throw err;
    },
    stream: async function* () {
      throw new Error("not used in these tests");
    },
  } as AiProvider;
}

function makeWorkingProvider(key: string, replyText: string): AiProvider {
  return {
    key,
    isConfigured: () => true,
    complete: async () => ({ content: replyText, finishReason: "stop" as const }),
    stream: async function* () {
      throw new Error("not used in these tests");
    },
  } as AiProvider;
}

function makeWorkingProviderWithUsage(
  key: string,
  replyText: string,
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
): AiProvider {
  return {
    key,
    isConfigured: () => true,
    complete: async () => ({ content: replyText, finishReason: "stop" as const, usage }),
    stream: async function* () {
      yield { delta: replyText, done: false };
      yield { delta: "", done: true, finishReason: "stop" as const, usage };
    },
  } as AiProvider;
}

function buildRegistryWith(providers: AiProvider[]): AiProviderRegistry {
  const registry = Object.create(AiProviderRegistry.prototype) as AiProviderRegistry;
  (registry as any).providers = new Map<string, AiProvider>();
  providers.forEach((p) => registry.register(p));
  return registry;
}

function buildOrchestrator(registry: AiProviderRegistry, aiSettingsProvider = "auto", health = new ProviderHealthService()) {
  const fakeConversationsService = {
    create: async (_userId: string, dto: any) => ({ id: "conv-1", ...dto }),
    findOne: async () => ({ id: "conv-1", messages: [] }),
    addMessage: async (_userId: string, conversationId: string, msg: any) => ({
      id: "msg-1",
      conversationId,
      ...msg,
      createdAt: new Date().toISOString(),
    }),
  };
  const fakeUsersService = {
    getAISettings: async () => ({ enabled: true, provider: aiSettingsProvider, model: "", temperature: 0.7, maxTokens: 1024 }),
  };
  const fakeToolRegistry = { getDefinitions: () => [], execute: async () => ({ success: true, message: "n/a" }) };
  const fakePromptManager = { buildMessages: (_ctx: any, history: any[]) => [{ role: "system", content: "sys" }, ...history] };
  const fakeConfig = { get: (key: string) => (key === "ai.maxToolIterations" ? 4 : undefined) };

  return new AiOrchestratorService(
    registry,
    fakePromptManager as any,
    fakeConversationsService as any,
    fakeUsersService as any,
    fakeToolRegistry as any,
    fakeConfig as any,
    health,
  );
}

describe("AiOrchestratorService - Auto routing fallback", () => {
  it("reproduces the Gemini-deprecated-model bug: Auto mode skips a 404-failing provider and answers via the next one, near-instantly", async () => {
    const registry = buildRegistryWith([
      makeWorkingProvider("demo", "demo fallback reply"),
      makeFailingProvider("gemini", 404, '404 - Model "gemini-2.5-flash" is no longer available to new users.'),
      makeWorkingProvider("anthropic", "anthropic reply"),
      makeWorkingProvider("openai", "openai answered instead"),
      makeFailingProvider("ollama", 404, "no local Ollama server running"),
    ]);
    const orchestrator = buildOrchestrator(registry);

    const start = Date.now();
    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hello" } as any);
    const elapsedMs = Date.now() - start;

    expect(result.provider).toBe("openai"); // gemini and ollama both fail in AUTO_PRIORITY_CHAIN order, openai is next
    expect(result.message.content).toBe("openai answered instead");
    expect(result.fallbackNote).toBeDefined();
    expect(result.fallbackNote).toMatch(/gemini/i);
    expect(elapsedMs).toBeLessThan(500); // must not hang - see this phase's report
  });

  it("falls back all the way to the always-available demo provider if every real provider fails", async () => {
    const registry = buildRegistryWith([
      makeWorkingProvider("demo", "demo fallback reply"),
      makeFailingProvider("gemini", 404),
      makeFailingProvider("anthropic", 401),
      makeFailingProvider("openai", 500),
      makeFailingProvider("ollama", 404),
    ]);
    const orchestrator = buildOrchestrator(registry);

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hello" } as any);

    expect(result.provider).toBe("demo");
    expect(result.message.content).toBe("demo fallback reply");
  });

  it("still applies the fallback chain even when the user explicitly selected a non-auto provider that isn't configured", async () => {
    const geminiUnconfigured: AiProvider = {
      key: "gemini",
      isConfigured: () => false,
      complete: async () => {
        throw new Error("should never be called - not configured");
      },
      stream: async function* () {
        throw new Error("not used");
      },
    } as AiProvider;

    const registry = buildRegistryWith([
      makeWorkingProvider("demo", "demo fallback reply"),
      geminiUnconfigured,
      makeWorkingProvider("openai", "openai reply"),
    ]);
    const orchestrator = buildOrchestrator(registry, "gemini"); // user explicitly picked gemini, but it's unconfigured

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hello" } as any);

    expect(result.provider).toBe("openai");
  });

  it("throws (AI disabled) when the user's AI settings have it turned off, without calling any provider", async () => {
    const registry = buildRegistryWith([makeWorkingProvider("demo", "should never be reached")]);
    const fakeConversationsService = {
      create: async (_u: string, dto: any) => ({ id: "conv-1", ...dto }),
      findOne: async () => ({ id: "conv-1", messages: [] }),
      addMessage: async () => ({ id: "msg-1" }),
    };
    const fakeUsersService = { getAISettings: async () => ({ enabled: false, provider: "auto", model: "", temperature: 0.7, maxTokens: 1024 }) };
    const orchestrator = new AiOrchestratorService(
      registry,
      { buildMessages: () => [] } as any,
      fakeConversationsService as any,
      fakeUsersService as any,
      { getDefinitions: () => [], execute: async () => ({ success: true, message: "" }) } as any,
      { get: () => 4 } as any,
      new ProviderHealthService(),
    );

    await expect(orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any)).rejects.toThrow(/turned off/i);
  });
});

describe("AiOrchestratorService - token usage accounting", () => {
  it("exposes the provider's token usage on SendMessageResult", async () => {
    const registry = buildRegistryWith([
      makeWorkingProviderWithUsage("openai", "hello!", { promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
    ]);
    const orchestrator = buildOrchestrator(registry);

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any);

    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });

  it("is undefined when the provider doesn't report usage (e.g. demo provider, or a provider/SDK path that doesn't expose it)", async () => {
    const registry = buildRegistryWith([makeWorkingProvider("demo", "canned reply")]);
    const orchestrator = buildOrchestrator(registry);

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any);

    expect(result.usage).toBeUndefined();
  });

  it("sums usage across multiple tool-calling iterations within one turn (a turn's true cost, not just the final reply)", async () => {
    let callCount = 0;
    const multiTurnProvider: AiProvider = {
      key: "openai",
      isConfigured: () => true,
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
      stream: async function* () {
        throw new Error("not used");
      },
    } as AiProvider;

    const registry = buildRegistryWith([multiTurnProvider]);
    const orchestrator = buildOrchestrator(registry);

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "create a task" } as any);

    // 20+30 prompt, 5+8 completion, 25+38 total across the two provider calls this turn made.
    expect(result.usage).toEqual({ promptTokens: 50, completionTokens: 13, totalTokens: 63 });
  });

  it("exposes usage on the streaming path's final 'done' event", async () => {
    const registry = buildRegistryWith([
      makeWorkingProviderWithUsage("openai", "hello!", { promptTokens: 12, completionTokens: 6, totalTokens: 18 }),
    ]);
    const orchestrator = buildOrchestrator(registry);

    const events: any[] = [];
    for await (const event of orchestrator.stream("user-1", "Alien", { content: "hi" } as any)) {
      events.push(event);
    }

    const doneEvent = events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent.usage).toEqual({ promptTokens: 12, completionTokens: 6, totalTokens: 18 });
  });
});

describe("AiOrchestratorService - ProviderHealthService integration", () => {
  it("deprioritizes a provider after repeated failures, preferring a healthy provider on subsequent turns instead of retrying the broken one first", async () => {
    const health = new ProviderHealthService();
    const flakyProvider = makeFailingProvider("gemini", 500, "upstream error");
    const reliableProvider = makeWorkingProvider("openai", "reliable reply");
    const registry = buildRegistryWith([flakyProvider, reliableProvider]);
    const orchestrator = buildOrchestrator(registry, "auto", health);

    // Fail gemini enough times to cross the health threshold.
    for (let i = 0; i < 3; i++) {
      const result = await orchestrator.sendMessage("user-1", "Alien", { content: `attempt ${i}` } as any);
      expect(result.provider).toBe("openai"); // openai is always the eventual answer since gemini always fails
    }

    expect(health.isHealthy("gemini")).toBe(false);
    expect(health.isHealthy("openai")).toBe(true);
  });

  it("still eventually tries an unhealthy provider if every healthy candidate also fails (never fully gives up on a provider)", async () => {
    const health = new ProviderHealthService();
    // Pre-mark "gemini" unhealthy the same way 3 real failures would.
    health.recordFailure("gemini");
    health.recordFailure("gemini");
    health.recordFailure("gemini");
    expect(health.isHealthy("gemini")).toBe(false);

    // Only a provider that recovers is registered besides the "unhealthy" one -
    // both fail except a working demo, proving gemini is still attempted (not skipped outright).
    let geminiWasCalled = false;
    const recoveredGemini: AiProvider = {
      key: "gemini",
      isConfigured: () => true,
      complete: async () => {
        geminiWasCalled = true;
        return { content: "gemini is actually fine now", finishReason: "stop" as const };
      },
      stream: async function* () {
        throw new Error("not used");
      },
    } as AiProvider;

    const registry = buildRegistryWith([recoveredGemini]); // only candidate available
    const orchestrator = buildOrchestrator(registry, "auto", health);

    const result = await orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any);

    expect(geminiWasCalled).toBe(true);
    expect(result.provider).toBe("gemini");
  });

  it("marks a provider healthy again immediately after a successful call, even if it was previously unhealthy", async () => {
    const health = new ProviderHealthService();
    health.recordFailure("gemini");
    health.recordFailure("gemini");
    health.recordFailure("gemini");
    expect(health.isHealthy("gemini")).toBe(false);

    const registry = buildRegistryWith([makeWorkingProvider("gemini", "recovered!")]);
    const orchestrator = buildOrchestrator(registry, "auto", health);

    await orchestrator.sendMessage("user-1", "Alien", { content: "hi" } as any);

    expect(health.isHealthy("gemini")).toBe(true);
  });

  it("listProviders() surfaces combined configured + health status", async () => {
    const health = new ProviderHealthService();
    health.recordFailure("gemini");
    health.recordFailure("gemini");
    health.recordFailure("gemini");

    const registry = buildRegistryWith([makeFailingProvider("gemini", 500), makeWorkingProvider("openai", "ok")]);
    const orchestrator = buildOrchestrator(registry, "auto", health);

    const statuses = orchestrator.listProviders();
    const geminiStatus = statuses.find((s) => s.key === "gemini");
    const openaiStatus = statuses.find((s) => s.key === "openai");

    expect(geminiStatus?.configured).toBe(true);
    expect(geminiStatus?.healthy).toBe(false);
    expect(openaiStatus?.healthy).toBe(true);
  });
});
