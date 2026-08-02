import { HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { HttpExceptionFilter } from "./http-exception.filter";

/**
 * Regression test for a bug found alongside the body-size-limit fix
 * (bug #1 in the 2026-08-02 QA report): a request body over the
 * (now-fixed) size limit is rejected by Express's body-parser as a plain
 * Error with its own `.status`/`.statusCode` (413) - NOT a Nest
 * HttpException. Before this fix, HttpExceptionFilter forced every
 * non-HttpException error to 500 regardless of any status it already
 * carried, so an oversized upload surfaced as a confusing generic 500
 * instead of a clear "file too large" response.
 */
describe("HttpExceptionFilter (regression: must trust a non-Nest error's own 4xx status)", () => {
  const filter = new HttpExceptionFilter();

  function runFilter(exception: unknown) {
    let capturedStatus: number | undefined;
    let capturedBody: any;
    const response = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: any) {
        capturedBody = body;
      },
    } as unknown as Response;
    const request = { method: "POST", url: "/api/storage/upload" } as Request;
    const host = {
      switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    } as any;

    filter.catch(exception, host);
    return { status: capturedStatus, body: capturedBody };
  }

  it("reports a body-parser PayloadTooLargeError (413) as 413, not a generic 500", () => {
    const bodyParserError: any = new Error("request entity too large");
    bodyParserError.status = 413;
    bodyParserError.statusCode = 413;
    bodyParserError.type = "entity.too.large";
    bodyParserError.expose = true;

    const { status, body } = runFilter(bodyParserError);

    expect(status).toBe(413);
    expect(body.message).toBe("Request body is too large.");
    expect(JSON.stringify(body)).not.toContain("entity.too.large");
  });

  it("still forces a genuine unexpected error to 500 with a generic message (no internal detail leaked)", () => {
    const dbError = new Error('password authentication failed for user "postgres" at host internal-db.private:5432');

    const { status, body } = runFilter(dbError);

    expect(status).toBe(500);
    expect(body.message).toBe("Internal server error");
  });

  it("does NOT trust a non-Nest error that suspiciously claims its own 5xx status - still forced to 500", () => {
    const suspiciousError: any = new Error("some internal thing");
    suspiciousError.status = 503;

    const { status } = runFilter(suspiciousError);

    expect(status).toBe(500);
  });

  it("a real Nest HttpException is completely unaffected by this fix", () => {
    const { status, body } = runFilter(new HttpException("Task not found", HttpStatus.NOT_FOUND));

    expect(status).toBe(404);
    expect(body.message).toBe("Task not found");
  });
});
