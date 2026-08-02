import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, map } from "rxjs";
import { SKIP_RESPONSE_TRANSFORM_KEY } from "../decorators/skip-response-transform.decorator";

export interface Envelope<T> {
  success: true;
  data: T;
}

/**
 * Wraps every successful response in `{ success: true, data: ... }`.
 * Errors are handled separately by HttpExceptionFilter so their shape
 * stays distinguishable from successful payloads.
 *
 * Routes marked with @SkipResponseTransform() are passed through
 * unwrapped - required for every @Sse() route (see that decorator's doc
 * comment for the exact bug this fixes: double-wrapping broke every SSE
 * event's shape, so the frontend's `event.type === "token"` checks never
 * matched anything and the chat UI hung forever on a successful request).
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_TRANSFORM_KEY, [context.getHandler(), context.getClass()]);
    if (skip) return next.handle();
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
