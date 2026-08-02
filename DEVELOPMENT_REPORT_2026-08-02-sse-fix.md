# AlienOS — AI Chat Bug Fix Report: SSE Response Never Appears

**Session date:** 2026-08-02
**Branch:** `feature/alien-ai-engine`
**Commits this report covers:** `d8c6263` → `53d3fbd`

This replaces the stale `DEVELOPMENT_REPORT_2026-07-31.md` and
`CHANGES_SINCE_LAST_ZIP.md` that had been reintroduced into the repo
alongside the obsolete frontend AI provider layer (see below) — both were
removed as part of this cleanup.

---

## 1. Deployment blocker (fixed first, prerequisite to everything else)

**Symptom:** Vercel failed to build commit `78ea02c` with the exact same
error already fixed months earlier:
```
src/features/ai/providers/registry.ts(15,14): Property 'auto' is missing...
```

**Root cause, verified via `git log`/`git merge-base`, not guessed:** the
original deletion (commit `4656570`) genuinely *is* an ancestor of
`78ea02c` — it was never lost. But `78ea02c` itself re-added 13 files as
pure insertions (0 deletions in that commit's diff), including the entire
dead provider/tools cluster **and** the very first development report ever
written for this project. That combination is the signature of an old ZIP
snapshot being copied back over an already-fixed repository, rather than
a merge conflict or branch mixup.

**Fix:** deleted the same 13 files again (`d8c6263`), re-verified zero
references anywhere in the codebase.

**Regression prevention added (`a51d5e6`):** `scripts/check-no-legacy-ai-provider-layer.cjs`
now runs as the *first* step of `npm run build` (Vercel's build command).
It checks for the exact forbidden paths and fails immediately with a
specific, actionable message if they ever reappear — instead of surfacing
as a confusing indirect TypeScript error days later. Verified in both
directions: passes cleanly on the correct tree, and was confirmed to
correctly detect and fail when a forbidden file was deliberately recreated
as a test.

---

## 2. The AI chat bug: response never appears, streaming never completes

### Reported symptoms
- User sends a message; HTTP request returns 200 OK; backend logs show it
  was received; the three-dot typing indicator never goes away; no
  assistant message ever renders.
- Streaming never completes; loading state never clears.
- Stop button appeared not to work.

### Root cause — traced with real executed code, not static review

**`TransformInterceptor` is registered globally** (`main.ts`,
`app.useGlobalInterceptors(...)`) and wraps *every* successful response in
a generic REST envelope: `{ success: true, data: <response> }`. This runs
on every route in the application — including the SSE streaming route,
which has its own, different wire-protocol requirement.

`ai.controller.ts`'s `streamMessage()` already maps each individual
streamed event to `{ data: event }` — this exact shape is what NestJS's
own SSE serializer (`sse-stream.js`, installed at
`node_modules/@nestjs/core/router/sse-stream.js`) requires: it reads
`.data` off each emitted object to build the `data: <json>\n\n` wire
frame.

Applying the global envelope **on top of** that already-wrapped shape
produces a double-wrapped object: `{ success: true, data: { data: <event> } }`.

**I proved this is real, not theoretical**, by instantiating the actual
installed `SseStream` class with this exact object shape and capturing
the literal bytes it produces:
```
data: {"data":{"type":"token","delta":"Hello"}}
```
instead of the correct:
```
data: {"type":"token","delta":"Hello"}
```

The frontend's `streamSse()` parser (in `src/lib/api/client.ts`) handles
either shape fine as valid JSON — the bug is entirely in what gets sent,
not how it's parsed (I separately verified the parser against 12 passing
tests, including frames deliberately split mid-frame across two network
reads, malformed/keep-alive frames, error responses, and abort signals —
all passed before this fix, ruling out the client parser as the cause).

But `chat-service.ts`'s `runStreaming()` dispatches on `event.type`:
```js
if (event.type === "token") { ... }
else if (event.type === "tool_call") { ... }
else if (event.type === "done") { ... }
else if (event.type === "error") { ... }
```
On the double-wrapped object, `event.type` is `undefined` — **none of
these branches ever match, for any event, ever.** The practical effect:

- Every `token` event is silently dropped → the assistant message's
  content never accumulates any text.
- The `done` event is silently dropped too → `status` never flips from
  `"streaming"` to `"complete"` → the loading indicator never clears.
- `tool_call`/`tool_result` events are dropped identically.

This is a complete, exact explanation for every reported symptom at once:
the HTTP request genuinely succeeds, the backend genuinely streams real
data, the frontend genuinely receives every byte — but nothing ever
visibly happens, forever. It also explains why the **Stop button looked
broken**: it correctly aborts the request, but since content never
accumulated in the first place, nothing visibly changes when it fires,
making it look like a no-op. And it explains why **non-streaming chat was
unaffected**: that endpoint's envelope wrapping is expected and correctly
unwrapped by the frontend's `request()` helper — only the streaming
route's already-once-wrapped shape breaks when wrapped a second time.

### The fix

1. Added `@SkipResponseTransform()` — a `SetMetadata`-based decorator,
   matching the existing `@Public()` decorator's pattern exactly.
2. `TransformInterceptor` now takes a `Reflector` dependency and checks
   for this metadata (via `getAllAndOverride`, checking both the handler
   and the controller class) before deciding whether to wrap. If present,
   it passes the Observable through completely untouched.
3. Applied `@SkipResponseTransform()` to `streamMessage()` in
   `ai.controller.ts`.
4. `main.ts` now constructs `TransformInterceptor` with `app.get(Reflector)`,
   since it's registered manually via `useGlobalInterceptors(new ...())`
   rather than being a DI-provided global interceptor.
5. Non-streaming routes are completely unaffected — they still get wrapped
   exactly as before (verified explicitly, see below).

### How it was verified — every claim backed by executed code

| Claim | How verified |
|---|---|
| The double-wrap bug is real | Drove the real installed `SseStream` class with the real double-wrapped shape; captured literal bytes matching the bug exactly |
| The fix produces correct bytes | Re-ran the same real `SseStream` drive with the interceptor's fixed skip logic; captured literal bytes: `data: {"type":"token","delta":"Hello"}` — flat, correct |
| The real `TransformInterceptor` class (not a simulation) skips the streaming route | Instantiated the actual `TransformInterceptor` + actual `Reflector` against the actual compiled `AiController`; `streamMessage` → unwrapped, `sendMessage` → still `{success,data}`-wrapped |
| The full pipeline works end-to-end | Fed the fixed backend's exact byte output through the real frontend `streamSse()` parser and the same dispatch logic `runStreaming()` uses: text correctly accumulated to `"Hello, world!"`, `done` event correctly received, status correctly flipped to `"complete"` |
| No backend regressions | `npx tsc --noEmit`: 35 errors — identical to the pre-existing, environment-only baseline (this sandbox can't reach `binaries.prisma.sh`; documented since the first session) |
| No test regressions | `npx jest`: **10 suites, 65 tests, all passing** |
| No frontend regressions | `npm run build`: clean |
| Attachments unaffected | `attachments.ts`, `ChatInput.tsx`, `MessageBubble.tsx` — confirmed untouched by `git status` this session; `storage.service.spec.ts` (real file I/O) still passing in the full suite |

### Regression tests added (permanent, committed)

1. **`transform.interceptor.spec.ts`** — unit tests against the real
   `TransformInterceptor` class: proves a route marked
   `@SkipResponseTransform()` passes through completely unwrapped (no
   `success` key, no extra `data` nesting), while a normal route still
   gets the `{success,data}` envelope. Also verifies nested fields (like
   token `usage`) survive untouched.
2. **`sse-wire-format.spec.ts`** — end-to-end test driving the actual
   installed `SseStream` serializer (not a mock of it), asserting the
   literal wire bytes for a realistic token/token/done sequence are
   correctly flat-shaped with every event's `type` a real string, never
   `undefined`. A second test explicitly reproduces what the old
   double-wrapped bytes looked like, so the distinction between "broken"
   and "fixed" stays an executable, permanent fact rather than a comment.

Both tests would **fail immediately** if this bug class ever recurred —
e.g., if `@SkipResponseTransform()` were accidentally removed from the
route, or a future interceptor reintroduced unconditional wrapping.

---

## 3. Manual verification checklist — status

Per the request to distinguish executed vs. inspected vs. still-needing
local confirmation:

| Item | Status |
|---|---|
| AI response appears | **Executed & verified** — closed-loop test proves the full pipeline |
| Tokens stream progressively | **Executed & verified** — parser correctly yields each token event in order, including when split across network reads |
| Done event received, status → complete | **Executed & verified** — closed-loop test |
| Three-dot loading indicator disappears | **Follows from the above** (status flips to `"complete"`, which is what the indicator's condition checks) — not independently re-tested in a real browser |
| Stop button aborts immediately | Cancellation wiring itself was verified in an earlier session (real timed abort test); this session's fix doesn't touch that wiring, only what happens to well-formed data once it arrives |
| Provider fallback still works | Unaffected — orchestrator-level fallback logic wasn't touched this session; verified via the existing, still-passing `orchestrator.service.spec.ts` suite |
| Attachments still work | Files confirmed untouched; storage layer tests still passing |
| Conversation saved correctly | Backend persistence (`ConversationsService.addMessage`) wasn't touched this session |

### What still needs real-environment confirmation

This sandbox has no live Postgres database, no browser, and no real AI
provider API keys. Everything above was verified via real executed code —
actual installed NestJS classes, actual frontend parsing logic, actual
RxJS pipelines — but not via clicking through a real browser against a
live deployment. **Before considering this fully closed:** send a real
message against a live backend + real provider and confirm visually that
tokens appear progressively, the indicator clears, and Stop immediately
halts generation.

---

## 4. Files changed this session

**Added:**
- `backend/src/common/decorators/skip-response-transform.decorator.ts`
- `backend/src/common/interceptors/transform.interceptor.spec.ts`
- `backend/src/ai/sse-wire-format.spec.ts`
- `scripts/check-no-legacy-ai-provider-layer.cjs`

**Modified:**
- `backend/src/ai/ai.controller.ts` — applied `@SkipResponseTransform()`
- `backend/src/common/interceptors/transform.interceptor.ts` — skip logic via `Reflector`
- `backend/src/main.ts` — construct `TransformInterceptor` with `Reflector`
- `package.json` (frontend) — build now runs the legacy-file guard first

**Removed (again):** the 13-file obsolete frontend AI provider cluster
(see §1), plus the two stale report files this report replaces.

## 5. Recommended next priorities
1. Real-environment smoke test per §3's outstanding item.
2. Consider auditing other global interceptors/pipes for the same
   "does this apply correctly to non-standard response types (SSE,
   file downloads, etc.)" question — `TransformInterceptor` was the one
   proven broken here, but it's worth a deliberate pass rather than
   assuming it's the only one.
3. Continue the outstanding items from prior sessions' reports (remaining
   module audit, Health/Analytics/Dashboard scoping).
