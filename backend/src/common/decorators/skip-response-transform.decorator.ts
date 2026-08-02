import { SetMetadata } from "@nestjs/common";

export const SKIP_RESPONSE_TRANSFORM_KEY = "skipResponseTransform";

/**
 * Exempts a route from TransformInterceptor's generic `{ success, data }`
 * envelope wrapping.
 *
 * Required for any Server-Sent Events (`@Sse()`) route: each individual
 * emitted value on an SSE route already has to be a `{ data: <event> }`
 * shape for Nest's own SSE serializer (see `sse-stream.js`'s `_transform`,
 * which reads `.data` off each emitted object to build the wire frame). If
 * a global interceptor ALSO wraps that same value in `{ success, data }`,
 * the result is a double-wrapped `{ success: true, data: { data: <event> } }`
 * - Nest's SSE serializer then JSON-stringifies that whole wrapped object
 * as the frame's data, so the client receives `data: {"data":{"type":...}}`
 * instead of `data: {"type":...}`. The frontend's event-type checks
 * (`event.type === "token"`, etc.) then never match anything, since
 * `event.type` is `undefined` on the wrapped object - every token, tool
 * call, and the final "done" event are silently dropped, and the chat UI
 * is stuck on its loading indicator forever even though the HTTP request
 * itself succeeded and the backend really did stream real data.
 */
export const SkipResponseTransform = () => SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);
