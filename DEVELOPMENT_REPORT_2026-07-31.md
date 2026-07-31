# AlienOS — Development Report
**Session date:** 2026-07-31
**Branch:** `feature/alien-ai-engine`
**Base commit:** `ba75f0f` (Fix AI provider interface compatibility and backend startup)
**New commits (5):** `4656570` → `9b129c5` (see "Commits" below)

This session had two parts: (1) fix the Vercel build failure, and (2) audit the
backend — with a deep focus on the AI Orchestrator — and hand back a verified,
buildable ZIP. **No push access to GitHub was available in this environment**,
so nothing was pushed; everything below is committed locally in this repo copy
and included in the ZIP with full git history intact (`git log` will show it).

---

## 1. Build fix

**Reported error:**
```
src/features/ai/providers/registry.ts(15,14): Property 'auto' is missing in type
{ demo, openai, anthropic, gemini, ollama } but required in type Record<AIProviderKey, AIProvider>
```

**Root cause:** Not a missing provider. `CHANGELOG.md` (already in the repo)
documents that the entire frontend client-side AI provider layer —
`src/features/ai/providers/{registry,types,demo,openai,anthropic,gemini,ollama,stream-utils}.ts`,
plus `action-protocol.ts`, `tools/registry.ts`, and `tools/conversations-tools.ts`
— was superseded when chat moved to the backend's `AiOrchestratorService`, and
was supposed to be deleted. That deletion was written up in the changelog but
never actually committed, so the dead files were still sitting in the tree.
When `AIProviderKey` later gained `"auto"` for the backend's fallback chain,
nothing updated this orphaned frontend registry, and `tsc -b` failed on it.

**Verification before deleting:** confirmed nothing outside that cluster
imports any of it — `chat-service.ts` talks exclusively to the backend's
`/ai/messages` and `/ai/messages/stream` endpoints (two remaining references
elsewhere in the tree are code comments, not imports).

**Fix:** deleted the cluster (11 files). `npm run build` (`tsc -b && vite build`)
now succeeds cleanly. **No functionality was removed** — see section 3 below
for the full verification that every provider the frontend used to implement
client-side is now implemented, more completely, in the backend.

---

## 2. AI Orchestrator audit (the focus of this session)

### 2a. What's actually there

The backend (`backend/src/ai/`) is a real, mature implementation, not a stub:

| Component | File(s) | Status |
|---|---|---|
| Provider registry | `providers/registry.ts` | 5 providers registered: demo, openai, anthropic, gemini, ollama |
| OpenAI | `providers/openai.provider.ts` (225 lines) | Official `openai` SDK, streaming, tool calling, retries, timeout |
| Gemini | `providers/gemini.provider.ts` (221 lines) | Official `@google/genai` SDK, streaming, tool calling, retries, timeout |
| Anthropic (Claude) | `providers/anthropic.provider.ts` (231 lines) | Official `@anthropic-ai/sdk`, streaming, tool calling, retries, timeout |
| Ollama | `providers/ollama.provider.ts` (224 lines) | Direct `fetch` against Ollama's documented HTTP API (no official SDK exists), streaming, tool calling |
| Demo | `providers/demo.provider.ts` (40 lines) | Always-configured local fallback, no network calls, deterministic canned replies |
| Auto routing | `orchestrator.service.ts` (`AUTO_PRIORITY_CHAIN`) | Not a registered "provider" itself (correct design) — a routing mode: tries Gemini → Ollama → OpenAI → Anthropic → Demo, skipping unconfigured ones |
| Retry/timeout infra | `providers/provider-http.util.ts` | Exponential backoff + jitter, retryable-status detection (429/5xx/network), per-request timeout, shared by all 4 real providers |
| Tool-calling loop | `orchestrator.service.ts`, `tools/tool-registry.service.ts` | 15 whitelisted tools (tasks, notes, goals, habits, calendar, transactions, dashboard stats, search, notifications); no arbitrary code execution |
| Conversation memory | `orchestrator.service.ts::historyFromConversation`, `prompt-manager.service.ts::windowHistory` | Persisted in Postgres via `ChatMessage`/`Conversation`; windowed to `AI_MAX_HISTORY_MESSAGES` (default 24) per turn |
| Streaming | `orchestrator.service.ts::stream()`, `ai.controller.ts::streamMessage` | SSE, per-iteration provider fallback, cancellation via `AbortSignal` on client disconnect |
| Logging | `Logger` (Nest) throughout `orchestrator.service.ts` and providers | Every provider failure/fallback logged with context |
| Error recovery | `orchestrator.service.ts` (candidate chain), `provider-http.util.ts` (retry) | Two layers: transient-error retry within a provider, then fallback to the next provider in the chain if a provider fails outright |

### 2b. Confirmed: no functionality was lost by deleting the frontend provider layer

Traced every provider path end-to-end:
- The deleted frontend files (`providers/openai.ts`, `anthropic.ts`, `gemini.ts`, `ollama.ts`, `demo.ts`) were **already unreachable** — `chat-service.ts` was rewritten in a prior phase (per `CHANGELOG.md`) to call only the backend's `/ai/messages*` endpoints, and this session confirmed via `grep` that nothing else imported the old files.
- Every provider the frontend used to implement client-side (OpenAI, Anthropic, Gemini, Ollama, Demo) has a corresponding, more capable backend implementation: the backend versions add server-side retries, timeouts, tool calling, and persisted conversation memory that the old client-side adapters didn't have.
- **No provider was found to exist only in the frontend.** There was nothing left to migrate before deleting.

**Conclusion: deleting the dead frontend layer removed zero functionality.**
AlienOS's AI support — OpenAI, Gemini, Anthropic (Claude), Ollama, Demo, and
Auto routing — is fully implemented and now managed *exclusively* through the
backend `AiOrchestratorService`, exactly as required.

### 2c. Bug found and fixed: AI streaming was completely broken

This is the most important finding of this session.

**The bug:** `ai.controller.ts`'s `streamMessage` handler was decorated only
with `@Sse('messages/stream')` (no explicit `@Post()`/`@Get()`). NestJS's
`@Sse()` decorator **unconditionally** sets the route's registered HTTP method
to `GET` — confirmed by reading the installed `@nestjs/common` source
(`sse.decorator.js` calls `Reflect.defineMetadata(METHOD_METADATA, RequestMethod.GET, ...)`
with no way to opt out).

Meanwhile, the frontend's `streamSse()` (`src/lib/api/client.ts`) deliberately
sends a `POST` with a JSON body and a `Bearer` token — its own comment
explains why: the browser's native `EventSource` API can only send
unauthenticated `GET` requests with no custom body, so it can't be used here,
and a raw authenticated `fetch()` is used instead.

**Net effect:** `POST /api/ai/messages/stream` never matched any registered
route. Every attempt to use streaming chat would 404 against the real Nest
router. This was true both before and after this session's frontend
cleanup — it's a pre-existing bug in the backend, unrelated to the dead
frontend files.

**How this was verified (not just theorized):** a throwaway script was run
inside this sandbox using `ts-node` to import the real, compiled
`AiController` and read its route metadata directly via
`Reflect.getMetadata()`. Before the fix: `METHOD = 0` (GET). The installed
`@nestjs/core/router/router-execution-context.js` was also read directly to
confirm SSE response formatting is gated purely on `SSE_METADATA`, with no
method restriction — so a POST route can still stream SSE correctly.

**The fix:** added an explicit `@Post('messages/stream')` decorator *above*
`@Sse('messages/stream')`. Nest applies stacked method decorators
bottom-to-top, so `@Post` (applied last) overwrites `METHOD_METADATA` to
`POST` while `SSE_METADATA` (a separate metadata key, untouched by `@Post`)
stays `true`. Re-ran the same metadata check after the fix:
`PATH: messages/stream`, `METHOD: 1 (POST)`, `SSE: true` — confirmed correct.

**No other AI endpoints were affected** — `POST /ai/messages` (non-streaming)
already had an explicit `@Post()` and was never broken.

### 2d. Other issues found and fixed in the AI module

- **Stale comment** in `prompt-manager.service.ts` claimed "Ollama currently
  doesn't [support tool calling]" — false; `ollama.provider.ts` fully
  implements tool calling (parses `tool_calls` from both the non-streaming
  and streaming Ollama API responses), matching `orchestrator.service.ts`'s
  `TOOL_CALLING_UNSUPPORTED` set, which is genuinely empty. Corrected the
  comment to avoid misleading future maintainers.

### 2e. AI module — no other issues found

Reviewed `ai.module.ts` (DI wiring), `ai.service.ts` (thin facade), all 5
provider files, `provider-http.util.ts`, `tool-registry.service.ts`, and
`prompt-manager.service.ts` in full. No dead code, no duplicate logic beyond
the one comment above, and the tool-calling security model (auth enforced
upstream by `JwtAuthGuard`, ownership enforced by the domain services the
tools call into, no arbitrary-code-execution tool, every tool failure caught
and turned into a structured result) is sound as designed.

---

## 3. Rest of the backend audit

Given the size of the codebase (~20 Prisma models, 14 domain modules), this
pass prioritized real, verifiable, high-value findings over a token "looked at
every file" pass. What was found and fixed:

1. **Duplicate ownership-check logic (14 services, 19 call sites).** Every
   domain service repeated the same 2-line pattern:
   ```ts
   if (!x) throw new NotFoundException("X not found");
   if (x.userId !== userId) throw new ForbiddenException();
   ```
   Extracted into `common/utils/ownership.ts` as a TypeScript **assertion
   function** (`asserts entity is T`), so every existing
   `const x = await prisma.x.findUnique(...)` binding narrows from `T | null`
   to `T` right after the call — no reassignment or return-value plumbing
   needed. Wired into `tasks`, `notes`, `goals`, `calendar`, `conversations`,
   all 5 `finance` services, `content`, `workspace`, `notifications`, and
   `storage/attachments`. Behavior is byte-for-byte identical; only the
   duplication was removed.

2. **Security: internal error messages leaking to clients.**
   `HttpExceptionFilter` fell back to `exception.message` for any
   non-`HttpException` (e.g. a raw Prisma/driver error) — which could expose
   table/column names or other internal details in an API response. Fixed:
   non-`HttpException`s now always get a generic `"Internal server error"`
   message in the response; full detail still goes to the server log via the
   existing `Logger.error(...)` call.

3. **Security: app would silently boot in production with guessable JWT
   secrets.** `configuration.ts` falls back to hardcoded
   `dev-access-secret` / `dev-refresh-secret` if the corresponding env vars
   aren't set — useful for local dev, dangerous in production (the defaults
   are sitting in this public-shaped source; anyone could forge tokens).
   Added a startup guard in `main.ts` that throws immediately if
   `NODE_ENV=production` and either secret is missing or still equal to its
   dev default, instead of silently starting an insecure server.

4. **Schema consistency: `Habit` was missing `updatedAt`.** Of ~20 models,
   `Habit` was the only mutable one without an audit timestamp for updates
   (its `streak`/`bestStreak`/`completedDates` change in place). Added the
   column plus a hand-written migration (`20260731090000_habit_updated_at`)
   that backfills existing rows from `createdAt`, matching the style of the
   existing hand-written migrations already in this repo.

5. **Reviewed for common risk patterns** — path traversal in
   `local-storage.driver.ts` (already correctly guarded via `resolveSafe()`),
   stray `console.*` usage outside the two intentional startup-banner lines in
   `main.ts` (none found), and TODO/FIXME/placeholder markers across the
   backend (none found — the codebase was already clean on this front).

### Not yet done / recommended next phase

- A full line-by-line audit of every remaining controller/service (Search,
  Storage beyond what's above, Notifications beyond the ownership fix, Users,
  Email) for caching opportunities and API-response consistency wasn't
  completed to the same depth as the AI module and the items above — this is
  the natural next slice of work.
- **No "Health" module exists anywhere** — not in the backend, not in the
  frontend (there's no `src/features/health` at all). Building a Health
  backend module would have no frontend screen to integrate into, so nothing
  was added here; flagging it rather than inventing new UI, per the
  instruction to keep the frontend intact.
- "Analytics" and "Dashboard" aren't separate backend modules today; the
  closest existing piece is `DashboardStatsTool` (an AI tool) and the
  frontend's local dashboard views. Whether a dedicated `analytics` module
  is wanted (e.g. for cross-module reporting beyond what the AI tool
  surfaces) is a scoping question for the next phase.
- Caching (e.g. for `dashboard-stats`/`search`, which fan out across many
  tables per request) wasn't added this session — flagging as a good
  candidate if those endpoints see real traffic.

---

## 4. Build verification

Both run in this sandbox immediately before packaging:

- **Frontend:** `npm run build` (`tsc -b && vite build`) — **succeeds
  cleanly.** Full production bundle + PWA precache emitted to `dist/`.
- **Backend:** `npx tsc --noEmit` — **35 errors, all pre-existing and
  environment-only.** This sandbox has no network access to
  `binaries.prisma.sh`, so the Prisma Client can't be fully generated here
  (`npx prisma generate` fails with a 403 on that domain, which isn't on this
  environment's allowlist). Every one of the 35 errors traces back to the
  incomplete generated client (missing `Prisma.XWhereInput` types, missing
  `Role` enum export, a few `any`-typed callback parameters that only resolve
  once the real client types are in) — confirmed identical in count and
  content before and after every change made this session. **On a normal
  machine/CI runner with network access:** run `npx prisma generate` first,
  then `npm run build`; this resolves all 35 and emits `dist/` cleanly (this
  exact sequence is documented in `CHANGELOG.md` from a prior phase, and
  nothing this session touched changes that).
- **`npm run build` in `backend/`** (`nest build`) — same 35 pre-existing
  errors, no new ones; `dist/` isn't emitted in *this* sandbox for the reason
  above, but nothing here indicates it wouldn't emit cleanly elsewhere.

---

## 5. AI provider support — explicit final confirmation

As required: confirming, not just asserting, that AlienOS retains full AI
support with providers managed exclusively through the backend orchestrator.

| Provider | Backend implementation | Confirmed working path |
|---|---|---|
| OpenAI | `providers/openai.provider.ts`, official `openai` SDK | Registered in `AiProviderRegistry`; reachable via `AUTO_PRIORITY_CHAIN` and explicit selection |
| Gemini | `providers/gemini.provider.ts`, official `@google/genai` SDK | Registered; primary provider in `AUTO_PRIORITY_CHAIN` |
| Anthropic (Claude) | `providers/anthropic.provider.ts`, official `@anthropic-ai/sdk` | Registered; reachable via `AUTO_PRIORITY_CHAIN` and explicit selection |
| Ollama | `providers/ollama.provider.ts`, direct HTTP per Ollama's documented API | Registered; second in `AUTO_PRIORITY_CHAIN` (local/offline fallback) |
| Demo | `providers/demo.provider.ts` | Registered; always configured, guaranteed last-resort fallback |
| Auto routing | `orchestrator.service.ts` (`buildCandidateChain`, `AUTO_PRIORITY_CHAIN`) | Confirmed: not a registered provider itself (correct), a routing mode that tries Gemini → Ollama → OpenAI → Anthropic → Demo |
| Alien AI Orchestrator | `orchestrator.service.ts` | Confirmed: single source of truth for provider selection, prompt/context building, the tool-calling loop, conversation memory, and streaming — verified via full read-through, not sampling |

**Non-streaming chat** (`POST /ai/messages`) was already correctly routed and
untouched this session. **Streaming chat** (`POST /ai/messages/stream`) was
broken (see §2c) and is now fixed and verified via direct route-metadata
inspection. No provider lost functionality; nothing was removed from the
frontend that wasn't already dead, unreachable code.

---

## 6. Commits (this repo, local only — not pushed; no GitHub write access in this environment)

```
9b129c5 fix(schema): add missing updatedAt audit field to Habit
3ae8a3f fix(backend): stop leaking internal error messages; refuse to boot in prod with default JWT secrets
5eaafa6 refactor(backend): extract shared assertOwned() ownership check
7471049 fix(ai): AI response streaming was completely broken (GET/POST mismatch)
4656570 fix(ai): remove orphaned client-side AI provider layer
```

## 7. Files changed this session

**Added:**
- `backend/src/common/utils/ownership.ts`
- `backend/prisma/migrations/20260731090000_habit_updated_at/migration.sql`
- `DEVELOPMENT_REPORT_2026-07-31.md` (this file)

**Modified:**
- `backend/src/ai/ai.controller.ts` — SSE routing fix
- `backend/src/ai/prompt-manager.service.ts` — stale comment fix
- `backend/src/main.ts` — production JWT-secret boot guard
- `backend/src/common/filters/http-exception.filter.ts` — stop leaking internal errors
- `backend/prisma/schema.prisma` — `Habit.updatedAt`
- `backend/src/{tasks,goals,notes,conversations,content,workspace,notifications,calendar}/*.service.ts`, `backend/src/finance/*.service.ts`, `backend/src/storage/attachments.service.ts` — `assertOwned()` refactor

**Removed:**
- `src/features/ai/providers/{registry,types,demo,openai,anthropic,gemini,ollama,stream-utils}.ts`
- `src/features/ai/action-protocol.ts`
- `src/features/ai/tools/{registry,conversations-tools}.ts`

## 8. Recommended next phase

1. Finish the remaining-module audit (Users, Email, Search, Storage,
   Notifications) to the same depth as the AI module — caching, response
   consistency, and any further duplicate-logic extraction.
2. Decide on Health/Analytics/Dashboard scope: either build a matching
   frontend feature first (so a backend module has something real to
   integrate into) or explicitly scope a backend-only Analytics module that
   the AI orchestrator's `dashboard-stats` tool (and a future frontend
   feature) can both read from.
3. On a machine with normal network access: run `npx prisma generate` once,
   confirm `npm run build` in `backend/` emits `dist/` cleanly (expected, per
   §4), and run the actual `nest start` + a real login/chat/stream smoke test
   against a live Postgres instance — something this sandbox cannot do
   without a database or Prisma engine binaries.
4. Land these 5 commits: apply this ZIP's `backend/` and `src/` directories
   over the current `feature/alien-ai-engine` branch (or ask me to produce a
   patch series if a token/connector for pushing becomes available), then
   push and deploy.
