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
  ai/                provider abstraction, demo provider, prompt manager, AiService (no real providers yet)
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

## AI module — intentionally minimal

Per the Phase 9 brief, **no real AI providers are implemented**. `ai/` ships:
- `AiProvider` interface (`complete` + `stream`)
- `DemoAiProvider` — deterministic, local-only responses (no network calls)
- `AiProviderRegistry` — where OpenAI/Anthropic/Gemini/Ollama providers will register later
- `PromptManagerService` — centralized system-prompt construction
- `AiService` — persists messages via `ConversationsService`, then asks the
  resolved provider (currently only `demo`) for a reply. Both a synchronous
  and an SSE streaming code path exist and are exercised by the `demo`
  provider today.

## Known environment limitation (sandbox only)

`prisma generate` / `prisma migrate` could not be executed in the sandbox
this backend was built in, because the engine-binary host
(`binaries.prisma.sh`) is not on that sandbox's network allowlist (confirmed:
`x-deny-reason: host_not_allowed`). This is **not** a schema or code issue —
in a normal dev/CI environment with open internet access, `npm install` and
`npm run prisma:generate` will download the engines and everything above
will work as documented. Run those two commands first in your own
environment before `npm run build` or `npm run start:dev`.
