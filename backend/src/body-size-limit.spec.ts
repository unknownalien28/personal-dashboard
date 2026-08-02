import express, { json } from "express";
import http from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Regression test for a real bug found during manual QA: a ~60-75KB text
 * file attachment ("chat stays loading forever, no response") turned out
 * to be rejected by Express's own default JSON body-parser limit (100KB),
 * which nobody had ever overridden in main.ts. Base64 encoding inflates a
 * file by ~33%, so ANY attachment over roughly 74KB of original size was
 * silently rejected at the framework level - before storage.controller.ts's
 * own MAX_UPLOAD_BYTES (15MB) check ever ran. The advertised 15MB limit was
 * a lie; the real effective limit was ~74KB.
 *
 * main.ts now explicitly sets `app.use(json({ limit: "21mb" }))` (comfortably
 * covering a 15MB file's base64 form + JSON/field overhead). This test
 * doesn't import main.ts directly (it calls NestFactory.create/bootstrap()
 * at module load, not test-friendly) - it reproduces the exact same
 * body-parser configuration point directly against a real Express server,
 * with the same "21mb" value main.ts uses. If main.ts's limit is ever
 * lowered or removed, keep this test's expected sizes in sync.
 */
describe("Request body size limit (regression: 60-75KB+ attachments were silently rejected)", () => {
  const CONFIGURED_LIMIT = "21mb"; // must match main.ts's app.use(json({ limit: ... }))

  function startServer(limit: string) {
    const app = express();
    app.use(json({ limit }));
    app.post("/upload", (req, res) => res.json({ ok: true }));
    return app.listen(0);
  }

  function postJson(port: number, payload: string): Promise<{ status?: number; error?: string }> {
    return new Promise((resolve) => {
      const req = http.request(
        { hostname: "127.0.0.1", port, path: "/upload", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve({ status: res.statusCode }));
        },
      );
      req.on("error", (e) => resolve({ error: e.message }));
      req.write(payload);
      req.end();
    });
  }

  function base64UploadPayload(originalFileKb: number): string {
    const base64 = Buffer.alloc(originalFileKb * 1024, "a").toString("base64");
    return JSON.stringify({ filename: "notes.txt", mimeType: "text/plain", dataBase64: base64 });
  }

  it("reproduces the bug: a 75KB+ file was rejected under Express's unconfigured 100kb default", async () => {
    const server = startServer("100kb"); // the previous, never-overridden default
    const port = (server.address() as AddressInfo).port;
    try {
      const result = await postJson(port, base64UploadPayload(80));
      expect(result.status).toBe(413);
    } finally {
      server.close();
    }
  });

  it("the fix: the same 80KB file succeeds under the configured 21mb limit", async () => {
    const server = startServer(CONFIGURED_LIMIT);
    const port = (server.address() as AddressInfo).port;
    try {
      const result = await postJson(port, base64UploadPayload(80));
      expect(result.status).toBe(200);
    } finally {
      server.close();
    }
  });

  it("the fix comfortably covers a file at storage.controller.ts's own advertised 15MB limit", async () => {
    const server = startServer(CONFIGURED_LIMIT);
    const port = (server.address() as AddressInfo).port;
    try {
      // 15MB file -> ~20MB base64 - the scenario the 21mb limit exists for.
      const result = await postJson(port, base64UploadPayload(15 * 1024));
      expect(result.status).toBe(200);
    } finally {
      server.close();
    }
  }, 15_000);
});
