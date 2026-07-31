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
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttpException ? exception.getResponse() : null;
    const message = this.extractMessage(rawResponse);
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
   */
  private extractMessage(rawResponse: unknown): string | string[] {
    if (rawResponse && typeof rawResponse === "object" && "message" in rawResponse) {
      return (rawResponse as { message: string | string[] }).message;
    }
    if (typeof rawResponse === "string") return rawResponse;
    return "Internal server error";
  }
}
