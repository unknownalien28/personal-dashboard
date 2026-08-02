# AlienOS Architecture — AI Pipeline

This document describes how AlienOS's AI assistant ("Alien") actually works,
end to end, as of the single-provider (Gemini-only) architecture introduced
2026-08-02. For why it was simplified from a 5-provider system to this, see
`MIGRATION_REPORT_2026-08-02-single-provider.md`.

## High-level flow

```
Frontend (React)
    │  POST /ai/messages          (single JSON response)
    │  POST /ai/messages/stream   (Server-Sent Events)
    ▼
Backend (NestJS)
    │  AiController → AiService → AiOrchestratorService
    ▼
GeminiProvider  (@google/genai SDK)
    ▼
Google Gemini API
    ▼
Response (JSON or streamed token/tool/done events) → persisted → returned
```

There is exactly one AI provider. There is no provider selection, priority
chain, or health-based fallback anywhere in this pipeline. If Gemini is
unavailable or a request fails, the orchestrator raises a clear,
user-facing error — it never silently substitutes a different response.

## Components

### `GeminiProvider` (`backend/src/ai/providers/gemini.provider.ts`)
The only class that talks to an external AI API. Wraps the official
`@google/genai` SDK:
- `isConfigured()` — whether `GEMINI_API_KEY` (or `AI_GEMINI_API_KEY`) is set.
- `complete(request)` — one-shot chat completion, with tool/function calling.
- `stream(request)` — the same, as an async generator of incremental chunks.
- Both paths share `provider-http.util.ts`'s `retryWithBackoff` (retries
  transient errors — 429/5xx/network — with exponential backoff; does NOT
  retry 4xx errors like an invalid/deprecated model) and
  `combineWithTimeout` (a real, enforced request timeout that actually
  cancels the outbound HTTP call, not just local waiting).
- Token usage (`AiTokenUsage`) is read from Gemini's `usageMetadata` on both
  paths and returned alongside the reply.

### `AiOrchestratorService` (`backend/src/ai/orchestrator.service.ts`)
The orchestration layer. For every turn, it:
1. Persists the user's message.
2. Confirms AI is enabled for the user and Gemini is configured
   (`assertGeminiAvailable()`) — throws `ForbiddenException` /
   `ServiceUnavailableException` with a clear message otherwise.
3. Builds the prompt: system prompt + windowed conversation history
   (`PromptManagerService`, capped at `AI_MAX_HISTORY_MESSAGES`) + any
   accumulated tool round-trips from earlier in this turn.
4. Calls `GeminiProvider.complete()`/`.stream()`.
5. If Gemini asks to call a tool, executes it (`ToolRegistryService`),
   persists the action, feeds the result back to Gemini, and loops (bounded
   by `AI_MAX_TOOL_ITERATIONS`) until it gets a final text answer.
6. Persists the assistant's reply and returns/streams the result, including
   summed token usage across every Gemini call made this turn.

Cancellation: every call threads an `AbortSignal` through from the
controller (tied to the client disconnecting, or the Stop button aborting
client-side, which then aborts the HTTP request, which the backend detects
via the request's `close` event). An aborted request settles cleanly
("Request cancelled.") rather than throwing or hanging.

### `PromptManagerService`
Builds the system prompt (persona, user name, module context hints, tool
availability) and windows conversation history to bound token usage as a
conversation grows.

### Tools (`backend/src/ai/tools/`)
15 whitelisted tools Gemini can call to take real actions in AlienOS
(create/update/delete tasks, notes, goals, habits, calendar events,
transactions; search; dashboard stats; notifications). Each tool is a
small, single-purpose class; `ToolRegistryService` exposes their
JSON-Schema definitions to Gemini and dispatches calls by name. No tool
executes arbitrary code — every action goes through the same
service-layer methods (with the same ownership/validation) that the
regular REST API uses.

### Streaming wire format (`POST /ai/messages/stream`)
Server-Sent Events. Each frame is `data: <json>\n\n` where the JSON is one
of:
```
{ "type": "token", "delta": "..." }
{ "type": "tool_call", "tool": "...", "args": {...} }
{ "type": "tool_result", "tool": "...", "success": true, "message": "..." }
{ "type": "done", "conversationId": "...", "usage": { "promptTokens": N, "completionTokens": N, "totalTokens": N } }
{ "type": "error", "message": "..." }
```
The route is registered as `@Post()` + `@Sse()` (NestJS's `@Sse()` alone
defaults to `GET`, which doesn't work with the Bearer-token auth and JSON
body this endpoint needs), and marked `@SkipResponseTransform()` so the
app's generic `{ success, data }` response envelope — applied to every
other route — does not wrap these events (wrapping them broke the
frontend's `event.type` matching in an earlier bug).

### Frontend (`src/features/ai/`)
- `chat-service.ts` — the only place in the frontend that talks to AI, and
  only via `POST /ai/messages` / `POST /ai/messages/stream`. Never calls
  Gemini or any AI vendor directly.
- `attachments.ts` — file upload/validation/inlining logic. Small
  (≤50KB) text-like attachments have their content inlined directly into
  the message sent to Gemini; larger or binary files are uploaded and
  referenced by link (genuine multimodal image understanding is out of
  scope — see the migration report's "future work" section for the
  general pattern this would follow).
- `AISection.tsx` (Settings) — shows whether Gemini is configured (`GET
  /ai/status`) and lets the user override the model, temperature, max
  tokens, and streaming preference. There is no provider picker.

## Configuration

All environment-driven, in `backend/.env.example`:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` (or `AI_GEMINI_API_KEY`) | Enables AI chat. Required — with neither set, every AI request returns a clear "not configured" error. |
| `AI_GEMINI_MODEL` | Default model (`gemini-3.6-flash`). Overridable per-request via the `model` field on `POST /ai/messages*`, or per-user via AI Settings. |
| `AI_REQUEST_TIMEOUT_MS` | Hard timeout per Gemini call (default 30000ms) — actually cancels the outbound request, not just local waiting. |
| `AI_MAX_RETRIES` | Retries for transient errors only (default 2). |
| `AI_MAX_TOOL_ITERATIONS` | Caps the tool-calling loop per turn (default 4). |
| `AI_MAX_HISTORY_MESSAGES` | Conversation history window (default 24). |

## What is deliberately NOT here

- No provider registry, priority chain, or "auto" routing mode.
- No `ProviderHealthService` / circuit breaker.
- No Demo/canned-response fallback provider.
- No per-user provider selection (`AISettings` has no `provider` field;
  the `AIProviderKey` Prisma enum was dropped).

If Gemini is down, misconfigured, or rate-limited, the person using AlienOS
sees a clear, honest error message. This is a deliberate reliability/UX
tradeoff — see the migration report.
