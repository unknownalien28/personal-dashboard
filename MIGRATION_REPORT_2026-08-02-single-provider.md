# AlienOS — Migration Report: Single-Provider (Gemini-Only) AI Architecture

**Date:** 2026-08-02
**Branch:** `feature/alien-ai-engine`

## Why this architecture was simplified

AlienOS's AI layer had grown into a 5-provider system (Gemini, OpenAI,
Anthropic, Ollama, a local "Demo" responder) with an "Auto" priority
routing chain, a `ProviderHealthService` circuit breaker, and per-attempt
retry/fallback logic across all of them. This bought resilience in theory,
but in practice introduced real instability:

- A user-initiated Stop-button click was, at one point, miscounted by the
  health tracker as a genuine provider failure, silently deprioritizing a
  perfectly healthy provider and routing unrelated later messages to the
  Demo responder — a confusing, hard-to-diagnose bug that only existed
  *because* the fallback machinery existed.
- Most deployments only ever configure one real provider anyway (Gemini),
  making the other four providers, the priority chain, and the health
  tracker pure surface area for bugs with no real benefit for the common
  case.
- Every new AI feature (attachments, token accounting, cancellation) had
  to be correctly implemented and tested across up to five different
  provider code paths, multiplying the chance of a subtle inconsistency
  in exactly one of them.

The decision: **Gemini is now AlienOS's only AI provider.** No provider
selection, no fallback chain, no health tracking, no canned "Demo"
response. If Gemini is unavailable, the person using AlienOS gets a clear,
honest error — never a silent substitute.

## What was removed

**Backend:**
- `providers/anthropic.provider.ts`, `openai.provider.ts`, `ollama.provider.ts`, `demo.provider.ts`
- `providers/registry.ts` (`AiProviderRegistry`)
- `providers/provider-health.service.ts` + its test suite (`ProviderHealthService`, the circuit breaker)
- The `AiProvider` polymorphic interface and `AI_PROVIDER_REGISTRY` DI token (kept the underlying request/response *data shapes* — `AiMessage`, `AiCompletionRequest/Result`, `AiStreamChunk`, `AiTokenUsage` — since those aren't multi-provider abstractions, just Gemini's own request/response contract)
- `AUTO_PRIORITY_CHAIN`, the candidate-chain builder, and all "try provider N, fall back to provider N+1" logic in `orchestrator.service.ts`
- The `provider` field on `SendMessageDto` (the per-request provider-selection option)
- The `provider` field and `AIProviderKey` enum on the `AISettings` Prisma model (migration: `20260802120000_drop_ai_provider_selection`)
- The `openai` and `@anthropic-ai/sdk` npm dependencies
- All associated OpenAI/Anthropic/Ollama environment variables

**Frontend:**
- The `AIProviderKey` type and `provider` field on the `AISettings` type
- The 6-option provider picker in Settings > AI (`AISection.tsx`), replaced with a simple Gemini configured/not-configured status indicator
- `fallbackNote`/`provider` fields on chat response and stream-event types

## What was simplified (kept, but no longer provider-agnostic)

- `AiOrchestratorService` now calls `GeminiProvider` directly — no
  candidate list, no per-attempt provider loop. The conversation-history
  building, tool-calling loop, streaming event generation, token-usage
  summation, cancellation handling, and structured logging are otherwise
  unchanged in behavior.
- `GET /ai/providers` (list every provider + configured status) became
  `GET /ai/status` (is Gemini configured, yes/no).
- `HttpExceptionFilter`, `combineWithTimeout`, `retryWithBackoff` — kept
  as-is. These aren't multi-provider complexity; they're legitimate
  request-level resilience (a real timeout, retrying a transient 5xx) that
  a single-provider system still benefits from.

## How the AI pipeline works now

See `docs/ARCHITECTURE.md` for the full diagram and component breakdown.
In short: `Frontend → AiController → AiOrchestratorService →
GeminiProvider → Google Gemini API`, with no branching provider logic
anywhere in that chain.

## Why this architecture is better (for AlienOS's current stage)

- **Fewer failure modes.** One provider, one code path, one thing that can
  go wrong at a time — instead of five, plus the routing logic between
  them.
- **Errors are honest.** A Gemini outage now surfaces as a clear "Alien
  couldn't reach Gemini just now" message. Previously, the same outage
  could silently produce a Demo-provider canned reply, which looks like a
  working feature but isn't actually answering the person's question.
- **Less to test, more of what's tested is real.** The removed
  `ProviderHealthService`/fallback-chain test suite covered scenarios
  (Ollama down, OpenAI rate-limited, health-based reordering) that don't
  apply to a single-provider deployment. The remaining test suite is
  smaller and entirely about the path that's actually used in production.
- **Simpler mental model for anyone maintaining this.** "AlienOS talks to
  Gemini" is a one-sentence description that's now actually true of the
  code, not an approximation of a more complicated reality.

## How to reintroduce multi-provider support later, if desired

The architecture doesn't preclude this — it just isn't built in right now.
If AlienOS later needs OpenAI/Anthropic/Ollama support again (e.g. for
users who want to bring their own API key, or for offline/local-model
support via Ollama):

1. **Reintroduce a provider interface**, similar to the old `AiProvider`
   (`isConfigured()`, `complete()`, `stream()`), and have `GeminiProvider`
   implement it alongside new provider classes. The request/response types
   in `gemini.types.ts` (rename back to something provider-neutral) are
   already shaped correctly for this — they were kept exactly because they
   don't assume a single provider.
2. **Reintroduce a registry** (`AiProviderRegistry` is a reasonable
   starting point to restore from git history at `4656570`'s parent or the
   pre-simplification commits) for looking up a configured provider by key.
3. **Decide the routing policy deliberately, not by default.** The old
   "Auto" priority chain plus a health-based circuit breaker was one
   option, but it was also the source of real bugs. Consider simpler
   alternatives first:
   - **Explicit per-user selection only** (no "Auto" mode at all) — the
     person picks their provider in Settings, and an outage is just an
     outage, surfaced honestly, with no automatic fallback. This avoids
     the entire class of "healthy provider punished for someone else's
     cancellation" bugs this migration fixed.
   - If automatic fallback is still wanted, make the health-tracking
     signal **only ever driven by genuine request failures** (this
     migration's bug was exactly a failure to make that distinction) and
     keep the reordering-not-exclusion design (never fully give up on a
     provider) that the old `ProviderHealthService` got right.
4. **Re-add per-provider environment variables and DTO/schema fields**
   (`AISettings.provider`, `SendMessageDto.provider`) with a proper Prisma
   migration — don't just re-add the enum value; write a fresh migration
   that documents why.
5. **Rebuild the test suite provider-by-provider**, including explicit
   regression tests for the two bug classes this migration fixed
   (cancellation-vs-failure conflation in health tracking; response
   double-wrapping breaking event shape) — those bugs are equally possible
   in any future fallback-chain design and are worth guarding against from
   day one next time.

## Files changed this migration

**Removed:** see "What was removed" above (7 backend files + 1 test file,
plus the enum/field removals).

**Added:**
- `backend/prisma/migrations/20260802120000_drop_ai_provider_selection/migration.sql`
- `docs/ARCHITECTURE.md`
- This report

**Modified:** `orchestrator.service.ts` (rewritten), `orchestrator.service.spec.ts` (rewritten), `gemini.provider.ts`, `ai.service.ts`, `ai.controller.ts`, `ai.module.ts`, `dto/ai.schemas.ts`, `prompt-manager.service.ts`, `tools/tool-registry.service.ts`, `tools/tool.interface.ts`, `configuration.ts`, `.env.example`, `package.json`, `prisma/schema.prisma`, `users/dto/user.schemas.ts`, `users/users.service.ts`, `users/users.controller.ts`, `src/types/models.ts`, `src/features/profile/settings-store.ts`, `src/features/profile/components/AISection.tsx`, `src/features/auth/auth-store.ts`, `src/features/ai/chat-service.ts`, `README.md`, `backend/README.md`, `CHANGELOG.md`.
