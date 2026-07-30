import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

export interface Envelope<T> {
  success: true;
  data: T;
}

/**
 * Wraps every successful response in `{ success: true, data: ... }`.
 * Errors are handled separately by HttpExceptionFilter so their shape
 * stays distinguishable from successful payloads.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
