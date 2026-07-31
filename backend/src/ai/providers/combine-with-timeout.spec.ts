import { combineWithTimeout } from "./provider-http.util";

describe("combineWithTimeout (regression: timeouts must actually cancel the outbound request)", () => {
  it("aborts the returned signal once the timeout elapses", async () => {
    const { signal, cleanup } = combineWithTimeout(undefined, 20);
    expect(signal.aborted).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(signal.aborted).toBe(true);
    cleanup();
  });

  it("aborts the returned signal immediately if the caller's own signal is already aborted", async () => {
    const callerController = new AbortController();
    callerController.abort();
    const { signal, cleanup } = combineWithTimeout(callerController.signal, 5_000);
    expect(signal.aborted).toBe(true);
    cleanup();
  });

  it("aborts the returned signal if the caller's signal fires before the timeout does", async () => {
    const callerController = new AbortController();
    const { signal, cleanup } = combineWithTimeout(callerController.signal, 5_000);
    expect(signal.aborted).toBe(false);
    callerController.abort();
    expect(signal.aborted).toBe(true);
    cleanup();
  });

  it("does NOT abort before the timeout if nothing else aborts it", async () => {
    const { signal, cleanup } = combineWithTimeout(undefined, 5_000);
    expect(signal.aborted).toBe(false);
    cleanup();
  });

  it("actually cancels a real in-flight fetch-like operation when the timeout fires (reproduces the fixed bug: previously a timeout only stopped local waiting, the outbound request kept running)", async () => {
    const { signal, cleanup } = combineWithTimeout(undefined, 20);

    // Simulate a provider SDK call that respects an AbortSignal, the way the
    // real OpenAI/Anthropic/Gemini/Ollama calls do via { signal }.
    let wasAborted = false;
    const simulatedProviderCall = new Promise((resolve, reject) => {
      const longRunningTimer = setTimeout(() => resolve("should never resolve - the request should be cancelled first"), 5_000);
      signal.addEventListener(
        "abort",
        () => {
          wasAborted = true;
          clearTimeout(longRunningTimer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });

    await expect(simulatedProviderCall).rejects.toThrow();
    expect(wasAborted).toBe(true);
    cleanup();
  }, 1000);

  it("cleanup() clears the internal timer so it doesn't fire after the caller is done with the signal", async () => {
    const { signal, cleanup } = combineWithTimeout(undefined, 20);
    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 40));
    // Even though 40ms > the 20ms timeout, cleanup() should have cleared the
    // timer before it fired, so the signal should NOT have been aborted by it.
    // (It's still technically possible for this to be flaky if cleanup() didn't
    // work, which is exactly what this test guards against.)
    expect(signal.aborted).toBe(false);
  });
});
