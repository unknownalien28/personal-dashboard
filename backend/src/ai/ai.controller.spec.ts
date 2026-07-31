import "reflect-metadata";
import { PATH_METADATA, METHOD_METADATA, SSE_METADATA } from "@nestjs/common/constants";
import { RequestMethod } from "@nestjs/common";
import { AiController } from "./ai.controller";

/**
 * Regression test for a real, previously-shipped bug: @Sse() unconditionally
 * sets a route's registered HTTP method to GET (see @nestjs/common's
 * sse.decorator.js), but the frontend deliberately POSTs a JSON body +
 * Bearer token to this endpoint (the native EventSource API can't send
 * either). Without an explicit @Post() applied after @Sse(), this endpoint
 * 404s against the real router - AI response streaming was completely
 * broken end-to-end until this was fixed. This test reads the actual route
 * metadata Nest will use to register the route, so it fails loudly if
 * anyone ever removes the @Post() decorator again.
 */
describe("AiController route metadata (regression: SSE streaming route)", () => {
  it("registers POST /ai/messages/stream as SSE (not the GET that @Sse() defaults to)", () => {
    const handler = AiController.prototype.streamMessage;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe("messages/stream");
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(SSE_METADATA, handler)).toBe(true);
  });

  it("registers POST /ai/messages as a plain POST (non-streaming) endpoint", () => {
    const handler = AiController.prototype.sendMessage;
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe("messages");
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
  });
});
