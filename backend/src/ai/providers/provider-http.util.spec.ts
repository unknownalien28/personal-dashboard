import { isRetryableStatus, retryWithBackoff, extractHttpStatus, withTimeout } from "./provider-http.util";

describe("provider-http.util", () => {
  describe("isRetryableStatus", () => {
    it("does not retry 404 (unknown/deprecated model - the exact bug reported for Gemini)", () => {
      expect(isRetryableStatus(404)).toBe(false);
    });

    it("does not retry 400/401/403 (bad request / bad or missing API key)", () => {
      expect(isRetryableStatus(400)).toBe(false);
      expect(isRetryableStatus(401)).toBe(false);
      expect(isRetryableStatus(403)).toBe(false);
    });

    it("retries 429 (rate limited)", () => {
      expect(isRetryableStatus(429)).toBe(true);
    });

    it("retries any 5xx (upstream server error)", () => {
      expect(isRetryableStatus(500)).toBe(true);
      expect(isRetryableStatus(503)).toBe(true);
      expect(isRetryableStatus(599)).toBe(true);
    });

    it("retries when there's no status at all (network-level errors)", () => {
      expect(isRetryableStatus(undefined)).toBe(true);
    });
  });

  describe("extractHttpStatus", () => {
    it("reads .status directly (the shape Google's ApiError uses)", () => {
      expect(extractHttpStatus({ status: 404 })).toBe(404);
    });

    it("reads .statusCode as a fallback", () => {
      expect(extractHttpStatus({ statusCode: 429 })).toBe(429);
    });

    it("reads .response.status as a fallback (some SDKs nest it there)", () => {
      expect(extractHttpStatus({ response: { status: 500 } })).toBe(500);
    });

    it("returns undefined for a plain error with no status anywhere", () => {
      expect(extractHttpStatus(new Error("network blip"))).toBeUndefined();
    });
  });

  describe("retryWithBackoff", () => {
    it("fails on the FIRST attempt for a 404 (deprecated/unavailable model) - reproduces the exact Gemini bug found this phase: Auto routing must fall back immediately, not after a multi-second retry delay", async () => {
      let attempts = 0;
      const start = Date.now();

      await expect(
        retryWithBackoff(
          async () => {
            attempts++;
            const err: any = new Error('404 - Model "gemini-2.5-flash" is no longer available to new users.');
            err.status = 404;
            throw err;
          },
          { maxAttempts: 3, baseDelayMs: 400 },
        ),
      ).rejects.toThrow();

      expect(attempts).toBe(1);
      expect(Date.now() - start).toBeLessThan(100);
    });

    it("retries a genuinely transient error (503) up to maxAttempts, WITH real backoff delay", async () => {
      let attempts = 0;
      const start = Date.now();

      await expect(
        retryWithBackoff(
          async () => {
            attempts++;
            const err: any = new Error("Service temporarily unavailable");
            err.status = 503;
            throw err;
          },
          { maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 200 },
        ),
      ).rejects.toThrow();

      expect(attempts).toBe(3);
      // Two retry delays of ~50ms+ should have elapsed between the 3 attempts.
      expect(Date.now() - start).toBeGreaterThanOrEqual(50);
    });

    it("succeeds without retrying when the first attempt succeeds", async () => {
      let attempts = 0;
      const result = await retryWithBackoff(async () => {
        attempts++;
        return "ok";
      });
      expect(result).toBe("ok");
      expect(attempts).toBe(1);
    });

    it("succeeds on a later attempt after transient failures, returning the eventual result", async () => {
      let attempts = 0;
      const result = await retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 3) {
            const err: any = new Error("rate limited");
            err.status = 429;
            throw err;
          }
          return "eventually ok";
        },
        { maxAttempts: 3, baseDelayMs: 10 },
      );
      expect(result).toBe("eventually ok");
      expect(attempts).toBe(3);
    });
  });

  describe("withTimeout", () => {
    it("resolves normally when the promise settles before the timeout", async () => {
      const result = await withTimeout(Promise.resolve("fast"), 1000, "test call");
      expect(result).toBe("fast");
    });

    it("rejects with a timeout error when the promise takes too long", async () => {
      const neverResolves = new Promise(() => {});
      await expect(withTimeout(neverResolves, 20, "slow call")).rejects.toThrow(/timed out/i);
    });
  });
});
