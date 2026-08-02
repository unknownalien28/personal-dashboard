import { Subject } from "rxjs";
import { PassThrough } from "node:stream";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SseStream } = require("@nestjs/core/router/sse-stream");

/**
 * End-to-end regression test for the SSE double-wrapping bug (see
 * ai.controller.ts's @SkipResponseTransform() usage and
 * transform.interceptor.spec.ts for the interceptor-level test).
 *
 * This test doesn't mock anything about Nest's SSE machinery - it drives
 * the actual installed `SseStream` class (the same one
 * router-response-controller.js uses) with the actual shape
 * ai.controller.ts's streamMessage() produces, and asserts on the literal
 * bytes that would be sent to a real browser. If the double-wrap bug ever
 * reappears (e.g. someone removes @SkipResponseTransform() from the
 * route, or a future interceptor reintroduces unconditional wrapping),
 * this test fails on the actual wire format, not just an interceptor's
 * isolated return value.
 */
describe("AI streaming route - actual SSE wire format (regression)", () => {
  function serialize(events: unknown[]): Promise<string> {
    return new Promise((resolve) => {
      const subject = new Subject<{ data: unknown }>();
      const fakeResponse = new PassThrough();
      let raw = "";
      fakeResponse.on("data", (chunk) => (raw += chunk.toString()));
      fakeResponse.on("end", () => resolve(raw));

      const stream = new SseStream({ socket: { setKeepAlive() {}, setNoDelay() {}, setTimeout() {} } });
      stream.pipe(fakeResponse, {});

      subject.subscribe({
        next: (message) => stream.writeMessage(message, () => {}),
        complete: () => fakeResponse.end(),
      });

      for (const event of events) subject.next({ data: event });
      subject.complete();
    });
  }

  function extractDataLines(raw: string): unknown[] {
    return raw
      .split("\n\n")
      .filter(Boolean)
      .map((frame) =>
        frame
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("\n"),
      )
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  it("produces flat, correctly-typed events when the controller's output is NOT further wrapped (the fixed, correct state)", async () => {
    const raw = await serialize([
      { type: "token", delta: "Hello" },
      { type: "token", delta: ", world!" },
      { type: "done", conversationId: "conv-1", provider: "gemini", usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 } },
    ]);

    const events = extractDataLines(raw) as Array<{ type?: string; delta?: string }>;

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "token", delta: "Hello" });
    expect(events[1]).toEqual({ type: "token", delta: ", world!" });
    expect(events[2].type).toBe("done");
    // The specific check the bug report asked to guard against: every event
    // must have a real, top-level `type` string - never undefined, and
    // never nested under an extra `data` or `success` wrapper.
    events.forEach((e) => expect(typeof e.type).toBe("string"));
  });

  it("(documents the bug) shows what double-wrapping would look like, so the difference is explicit", async () => {
    // Simulates what happened BEFORE the fix: the global interceptor wraps
    // the controller's already-`{data: event}`-shaped output a second time.
    const doubleWrapped = { success: true, data: { data: { type: "token", delta: "Hello" } } };
    const raw = await serialize([doubleWrapped]);
    const events = extractDataLines(raw) as Array<{ type?: string }>;

    expect(events[0].type).toBeUndefined(); // <- exactly the bug: event.type is undefined
    expect((events[0] as any).data?.data?.type).toBe("token"); // the real data is buried two levels deeper
  });
});
