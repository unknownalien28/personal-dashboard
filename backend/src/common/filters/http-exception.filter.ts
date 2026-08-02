import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Catches every exception (Nest HttpException and unexpected errors alike)
 * and normalizes them into one JSON shape so the frontend never has to
 * special-case error formats per-endpoint.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : extractNonNestStatusCode(exception);

    const rawResponse = isHttpException ? exception.getResponse() : null;
    const message = this.extractMessage(rawResponse, statusCode);
    const error = isHttpException ? exception.name : "InternalServerError";

    const body: ErrorBody = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url} -> ${statusCode}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}: ${JSON.stringify(message)}`);
    }

    response.status(statusCode).json(body);
  }

  /**
   * `rawResponse` only exists for Nest `HttpException`s (validation errors,
   * `NotFoundException`, etc.) — those messages were authored to be
   * client-safe, so they're passed through as-is. Anything else (a raw
   * thrown `Error`, a Prisma error, a driver-level exception) is NOT an
   * `HttpException` and must never have its `.message` sent to the client:
   * that can leak table/column names, connection details, or stack-adjacent
   * internals. Those get a generic message here; the real detail still goes
   * to the server log via `this.logger.error(...)` in `catch()` above.
   *
   * One specific, safe exception: a 413 from extractNonNestStatusCode below
   * (Express/body-parser's PayloadTooLargeError, raised when a request body
   * exceeds the configured size limit) gets a clear, curated message - the
   * fact that the request was too large is exactly what the request itself
   * already reveals, there's nothing internal to leak, and "Internal server
   * error" would be actively misleading for what's really a client-side
   * "your file is too big" problem.
   */
  private extractMessage(rawResponse: unknown, statusCode: number): string | string[] {
    if (rawResponse && typeof rawResponse === "object" && "message" in rawResponse) {
      return (rawResponse as { message: string | string[] }).message;
    }
    if (typeof rawResponse === "string") return rawResponse;
    if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE) return "Request body is too large.";
    return "Internal server error";
  }
}

/**
 * Express/body-parser errors (e.g. a request body exceeding the configured
 * size limit) are plain `http-errors`-based Error objects with a numeric
 * `.status`/`.statusCode` - NOT Nest `HttpException` instances - so the
 * `isHttpException` branch above never sees them. Without this, EVERY such
 * error was forced to 500 regardless of its real status, which for a 413
 * (payload too large) meant a confusing generic 500 instead of a clear
 * "your file is too big" response the frontend could act on.
 *
 * Deliberately narrow: only trusts a 4xx status here. A 4xx from a
 * framework-level parsing error reflects a real problem with the request
 * itself (bad size, bad syntax) that the client can already see for
 * itself from what it sent - there's no new information being leaked by
 * passing the status through. Anything else (undefined, or a raw error
 * that happens to carry a suspicious 5xx-range "status") still safely
 * falls back to 500, since a library error claiming its own 5xx status
 * isn't necessarily trustworthy the way a framework-level 4xx parsing
 * rejection is.
 */
function extractNonNestStatusCode(exception: unknown): number {
  const status = (exception as { status?: unknown; statusCode?: unknown })?.status ?? (exception as { statusCode?: unknown })?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 500) return status;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
