import { Reflector } from "@nestjs/core";
import { of, firstValueFrom } from "rxjs";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { TransformInterceptor } from "./transform.interceptor";
import { SkipResponseTransform } from "../decorators/skip-response-transform.decorator";

/**
 * Regression test for a real, previously-shipped bug: TransformInterceptor
 * was registered globally and wrapped EVERY response - including the SSE
 * streaming route - in `{ success: true, data: ... }`. The streaming
 * controller already wraps each event as `{ data: event }` for Nest's own
 * SSE serializer, so the result was a double-wrapped
 * `{ success: true, data: { data: <event> } }`. The frontend's
 * `event.type === "token"` checks then matched nothing (event.type was
 * undefined on the double-wrapped object), so the chat UI hung on its
 * loading indicator forever despite the HTTP request succeeding and the
 * backend genuinely streaming real data.
 *
 * This test uses a real ExecutionContext-shaped object with a handler that
 * actually has @SkipResponseTransform() applied via SetMetadata, and
 * verifies the interceptor's real behavior via Reflector - not a mock of
 * the interceptor's internals.
 */
describe("TransformInterceptor (regression: must not wrap SSE responses)", () => {
  const reflector = new Reflector();
  const interceptor = new TransformInterceptor(reflector);

  class FakeSseController {
    @SkipResponseTransform()
    streamRoute() {}

    plainRoute() {}
  }

  function contextFor(handler: () => void): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => FakeSseController,
    } as unknown as ExecutionContext;
  }

  function callHandlerReturning<T>(value: T): CallHandler<T> {
    return { handle: () => of(value) } as CallHandler<T>;
  }

  it("passes SSE stream events through completely unwrapped (the actual fix)", async () => {
    const event = { type: "token", delta: "hello" };
    const result = await firstValueFrom(
      interceptor.intercept(contextFor(FakeSseController.prototype.streamRoute), callHandlerReturning(event)),
    );

    expect(result).toEqual({ type: "token", delta: "hello" });
    // Explicitly assert the double-wrap bug does NOT reproduce: no `success`
    // key, and `.data` is not present wrapping the event a second time.
    expect(result).not.toHaveProperty("success");
    expect(result).not.toHaveProperty("data");
  });

  it("still wraps a normal (non-SSE) route's response in the {success,data} envelope", async () => {
    const result = await firstValueFrom(
      interceptor.intercept(contextFor(FakeSseController.prototype.plainRoute), callHandlerReturning({ id: "task-1", title: "Buy milk" })),
    );

    expect(result).toEqual({ success: true, data: { id: "task-1", title: "Buy milk" } });
  });

  it("every 'done' event field (including nested usage) survives untouched when unwrapped", async () => {
    const doneEvent = {
      type: "done",
      conversationId: "conv-1",
      provider: "gemini",
      usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
    };
    const result = await firstValueFrom(
      interceptor.intercept(contextFor(FakeSseController.prototype.streamRoute), callHandlerReturning(doneEvent)),
    );

    expect(result).toEqual(doneEvent);
  });
});
