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
    const message = this.extractMessage(rawResponse, exception);
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

  private extractMessage(rawResponse: unknown, exception: unknown): string | string[] {
    if (rawResponse && typeof rawResponse === "object" && "message" in rawResponse) {
      return (rawResponse as { message: string | string[] }).message;
    }
    if (typeof rawResponse === "string") return rawResponse;
    if (exception instanceof Error) return exception.message;
    return "Internal server error";
  }
}
