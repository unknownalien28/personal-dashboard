# AlienOS — Changes Since Last ZIP (2026-07-31-v2)

This ZIP includes everything from three sessions since the last delivered
package: **Production Stabilization** and two **AI Engine Hardening**
passes. Full detail for each fix lives in the corresponding commit message
(`git log` in this repo) — this file is a consolidated index.

## Commits included in this ZIP (newest first)

```
642fca4 test+perf: production stabilization leftovers (Jest config, non-AI test specs, re-render fix)
604079d feat(ai): provider health detection, Auto-routing improvements, token accounting, timeout hardening
84337f5 feat(ai): implement file attachments in chat (previously a complete stub)
8b61a60 fix(ai): Stop button did nothing in non-streaming mode; orphaned non-streaming requests on client disconnect
f8a8448 fix(ai): Gemini deprecated model + Node version guard
9b129c5 fix(schema): add missing updatedAt audit field to Habit
3ae8a3f fix(backend): stop leaking internal error messages; refuse to boot in prod with default JWT secrets
5eaafa6 refactor(backend): extract shared assertOwned() ownership check
7471049 fix(ai): AI response streaming was completely broken (GET/POST mismatch)
4656570 fix(ai): remove orphaned client-side AI provider layer
```

## Production Stabilization session
- Removed dead code: `PlaceholderPage.tsx` (zero references anywhere).
- Fixed a real re-render performance issue: `updateMessage()` was bumping
  the conversation's `updatedAt` on every single streamed token, which
  both wasted work and defeated sidebar memoization. `ConversationSidebar`
  is now memoized with a comparator scoped to what it actually renders.
- Added the missing Jest configuration (dependencies were installed but
  never wired up — `npm test` had nothing to run against) and a starter
  test suite: retry/timeout logic, storage (real file I/O), the shared
  `assertOwned` ownership helper, and `TasksService` (mocked Prisma).

## AI Engine Hardening (two sessions)
- **Timeout handling bug fixed**: every provider's non-streaming
  `complete()` only raced a local timeout — the actual outbound HTTP
  request to OpenAI/Anthropic/Gemini/Ollama kept running uncancelled in
  the background. Fixed with a shared `combineWithTimeout()` helper
  applied consistently to all 4 providers, both streaming and
  non-streaming.
- **Token usage accounting** added from scratch: every provider now
  reports prompt/completion/total tokens; summed across tool-calling
  iterations and exposed on both the non-streaming result and the
  streaming `"done"` event.
- **`ProviderHealthService`** added: a lightweight circuit breaker (3
  consecutive failures → deprioritized for 30s, never hard-blocked) so
  Auto routing stops repeatedly timing out on a provider it already knows
  is broken, while still guaranteeing eventual recovery detection.
- **Structured logging**: provider/latency/tokens/finish-reason on
  success, provider/latency/error on failure, dedicated fallback-decision
  and turn-completion log lines.
- Removed `external-providers.stub.ts`, an orphaned pre-Phase-2 scaffold.
- 8 backend test suites / 60 tests added or extended this phase, all
  passing, covering: timeout cancellation (regression), provider health
  transitions, token usage (single-call, multi-iteration, streaming),
  Auto-routing failover (including the exact Gemini-404 scenario from
  earlier in this project), and the SSE routing regression from a prior
  session.

## Verification for this delivery
- `npm run build` (frontend): clean.
- `npx tsc --noEmit` (backend): 35 errors — identical count/content to the
  pre-existing, environment-only baseline documented since the first
  session in this project (this sandbox can't reach
  `binaries.prisma.sh` to fully generate the Prisma Client; resolved by
  running `npx prisma generate` on a machine with normal network access).
- `npx jest` (backend): **8 suites, 60 tests, all passing.**

## What still needs real-environment verification
Everything above was verified via real executed code (test suites,
targeted scripts) in a sandbox with no live database, browser, or AI
provider API keys. Before shipping: run against a real Postgres instance
with real API keys and confirm end-to-end chat (all 4 providers + Auto +
Demo), file attachments, and the Stop button in an actual browser.
