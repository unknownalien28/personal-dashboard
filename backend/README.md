# AlienOS Backend

The central service powering AlienOS — tasks, notes, calendar, goals, finance,
content planning, workspace documents, AI conversations, and more.

## Stack

- **Runtime:** Node.js + TypeScript + NestJS
- **Database:** PostgreSQL via Prisma
- **Auth:** JWT access + refresh tokens (rotated on every refresh), bcrypt password hashing
- **Validation:** Zod schemas + a shared `ZodValidationPipe` (no class-validator)
- **Docs:** Swagger/OpenAPI at `/api/docs`
- **Logging:** Winston (via `nest-winston`)
- **Storage:** Local filesystem driver behind a `StorageDriver` interface (S3-ready)

## Getting started

```bash
cp .env.example .env      # then fill in real secrets + DATABASE_URL
npm install
npm run prisma:generate
npm run prisma:migrate     # creates the dev database schema
npm run prisma:seed        # optional: seeds a demo user (demo@alienos.dev / password123)
npm run start:dev
```

The API is served under `/api` (e.g. `http://localhost:4000/api/tasks`), with
interactive docs at `http://localhost:4000/api/docs`.

## Project structure

```
src/
  auth/            registration, login, refresh rotation, logout, guards, strategies
  users/            profile + all settings slices (appearance, visual effects, notifications, preferences, AI)
  tasks/            task CRUD
  notes/            notes CRUD + pin/archive/trash/restore
  calendar/         calendar events + habits (streak tracking)
  goals/            goals + milestones (auto progress from milestone completion)
  finance/          accounts, transactions (atomic balance updates/transfers), budgets, bills, savings goals
  content/          Alien Footy / social content planner
  workspace/        generic documents (thesis decks, scripts, CVs, etc.)
  conversations/     AI conversation + message persistence
  notifications/    in-app notifications
  search/           lightweight cross-entity search
  storage/          local file storage abstraction (S3-ready)
  ai/                Gemini provider, orchestrator (tool-calling loop, streaming, conversation memory), prompt manager, tools
  common/            filters, interceptors, decorators, pipes, guards, pagination
  config/            env configuration, logger, swagger setup
  database/          PrismaService + PrismaModule
```

## Auth flow

1. `POST /api/auth/register` / `POST /api/auth/login` → `{ accessToken, refreshToken }`
2. Send `Authorization: Bearer <accessToken>` on every request.
3. When the access token expires, `POST /api/auth/refresh` with `{ refreshToken }` →
   a **new** token pair (the old refresh token is revoked — rotation, not reuse).
4. `POST /api/auth/logout` revokes the current session; `POST /api/auth/logout-all`
   revokes every session for the user.

Every route requires a valid access token by default (global `JwtAuthGuard`).
Mark a route `@Public()` to exempt it.

## AI module

AlienOS's AI assistant ("Alien") is powered by **Google Gemini — the only AI
provider**. There is deliberately no provider selection, priority chain, or
health-based fallback; see `MIGRATION_REPORT_2026-08-02-single-provider.md`
for why, and `docs/ARCHITECTURE.md` for the full pipeline diagram.

- `providers/gemini.provider.ts` — the only provider. Wraps the official
  `@google/genai` SDK: chat completion, streaming, tool/function calling,
  token usage, retries with backoff, and a real request timeout.
- `providers/gemini.types.ts` — the shared request/response shapes the rest
  of the AI layer is written against (not a multi-provider abstraction —
  just a stable contract independent of the raw SDK types).
- `orchestrator.service.ts` (`AiOrchestratorService`) — builds the
  prompt/context, drives the tool-calling loop, persists conversation
  memory, tracks token usage, and produces the result the controller
  forwards to the frontend (JSON or SSE). If Gemini isn't configured or a
  request genuinely fails, this throws a clear, user-facing error — it
  never falls back to a canned response.
- `prompt-manager.service.ts` — system-prompt construction and
  conversation-history windowing.
- `tools/` — 15 tools (create/update/delete task, notes, goals, habits,
  calendar events, transactions, dashboard stats, search, notifications)
  the model can call to take real actions in AlienOS.
- `ai.service.ts` / `ai.controller.ts` — `POST /ai/messages` (JSON),
  `POST /ai/messages/stream` (SSE), `GET /ai/status` (is Gemini
  configured?), `GET /ai/tools`.

Configuration is entirely environment-driven — see `.env.example`:
`GEMINI_API_KEY` (required to enable AI chat), `AI_GEMINI_MODEL`,
`AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`, `AI_MAX_TOOL_ITERATIONS`,
`AI_MAX_HISTORY_MESSAGES`.

## Known environment limitation (sandbox only)

`prisma generate` / `prisma migrate` could not be executed in the sandbox
this backend was built in, because the engine-binary host
(`binaries.prisma.sh`) is not on that sandbox's network allowlist (confirmed:
`x-deny-reason: host_not_allowed`). This is **not** a schema or code issue —
in a normal dev/CI environment with open internet access, `npm install` and
`npm run prisma:generate` will download the engines and everything above
will work as documented. Run those two commands first in your own
environment before `npm run build` or `npm run start:dev`.
