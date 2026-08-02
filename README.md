# AlienOS

**Your Personal Productivity Operating System.**

Tasks, notes, calendar, goals, finance, content planning, and an AI assistant
("Alien") — in one clean, fast, private app.

AlienOS is a full-stack application: a React frontend talking to a real
NestJS + PostgreSQL backend (see `backend/README.md`). The AI assistant is
powered by Google Gemini — see `docs/ARCHITECTURE.md` for the full AI
pipeline and `MIGRATION_REPORT_2026-08-02-single-provider.md` for why Gemini
is the only provider.

## Stack

**Frontend**
- **React 19 + TypeScript** — UI and type safety
- **Vite** — dev server and build tool
- **Tailwind CSS v4** — styling
- **React Router** — navigation between modules
- **Zustand** — state management, with a `persist` middleware for
  device-local UI preferences (theme, layout) — application data itself is
  persisted server-side (see below)
- **date-fns** — date math for Calendar and Finance (recurrence, period ranges)
- **Recharts** — progress and finance charts
- **lucide-react** — icons
- **vite-plugin-pwa** — installable PWA support (manifest, service worker, offline caching)

**Backend** (`backend/`)
- **NestJS + TypeScript**, **PostgreSQL** via Prisma, JWT auth
- **Google Gemini** — AlienOS's AI provider, via the official `@google/genai` SDK
- Full details: `backend/README.md`

## Running locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview   # serves the production build locally, to sanity-check it
```

## Deploying to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, "Add New Project" -> import that repository.
3. Vercel auto-detects Vite. Framework preset: **Vite**. Build command:
   `npm run build`. Output directory: `dist`. No other config needed.
4. Deploy.

Every push to your main branch will auto-deploy.

## Data & storage architecture

Application data (tasks, notes, events, habits, finances, conversations,
etc.) is persisted server-side in PostgreSQL via the backend — not in
`localStorage`. The frontend's Zustand `persist` middleware is used only for
device-local UI state (theme, layout preferences, draft/staged UI state) via:

- `src/lib/storage/types.ts` — the `StorageAdapter` interface
- `src/lib/storage/localStorageAdapter.ts` — today's implementation
- `src/lib/storage/index.ts` — the single export every store imports from

All real data operations go through the backend's REST API
(`src/lib/api/client.ts`) with JWT auth — see `backend/README.md`.

## Mobile-first & PWA

The app is built mobile-first: base styles target phones, with `md:` overrides
layering in the desktop experience (sidebar, denser controls) at 768px+.

- **Navigation** — bottom tab bar on mobile, collapsible sidebar on desktop/tablet-landscape.
- **Touch targets** — interactive controls are 44px+ on mobile (`Button`, topbar icons,
  bottom nav), tightened for desktop density above the `md` breakpoint.
- **Safe areas** — `env(safe-area-inset-*)` is applied to the top bar, bottom nav, and
  outer shell so content isn't clipped by notches or the iOS/Android gesture bar.
- **Swipe gestures** — two purpose-built components: `src/components/ui/SwipeableRow.tsx`
  (binary swipe-to-complete/delete, used by Tasks) and `src/components/ui/SwipeActions.tsx`
  (reveal-and-tap multi-action swipe, used by Notes, Goals, and Finance list items, which
  need more than two actions per row).
- **Performance** — every feature module is route-split with `React.lazy`, so the
  initial bundle only includes what's needed for the first screen.
- **Installable (PWA)** — a web app manifest and service worker (via `vite-plugin-pwa`)
  let the app be installed to the home screen on Android and iOS, with the app shell
  precached for offline loading. Since all data already lives in `localStorage`,
  the app is fully usable offline once installed.

To test installability locally: `npm run build && npm run preview`, then open the
preview URL — Chrome will offer an install prompt. On Vercel, this works automatically
since HTTPS is required for service workers and Vercel provides it by default.



## Module status

Fully implemented: Tasks, Notes, Calendar, Goals, Finance, Profile & Settings,
Home, and the AI Assistant (Alien) — real chat, streaming, file attachments,
and tool-calling backed by Gemini. Content Planner is implemented for
Alien Footy-style social content.

## Environment variables

The frontend itself needs only `VITE_API_URL` (defaults to
`http://localhost:4000/api`) to point at the backend. The backend has its own
`.env` — see `backend/.env.example` and `backend/README.md`, and
`docs/ARCHITECTURE.md` for the AI-specific variables (`GEMINI_API_KEY`, etc).

## Folder structure

```
src/
  components/
    layout/     -> Sidebar, Topbar, MobileNav, AppShell
    ui/         -> shared building blocks (Button, Card, etc.)
  features/     -> one folder per module (tasks, notes, calendar, goals,
                  finance, content, ai, profile, home)
  lib/
    storage/    -> storage abstraction (see above)
    utils/
    theme-store.ts, nav-items.ts
  hooks/
  types/
```

Each feature module owns its own components, Zustand store, and types —
keeping modules independent and easy to extend or remove without touching
the rest of the app.
