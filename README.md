# Personal Dashboard

A personal productivity dashboard — tasks, notes, calendar, goals & habits,
finance, content planning, and an AI assistant — in one clean, fast app.

## Stack

- **React 19 + TypeScript** — UI and type safety
- **Vite** — dev server and build tool
- **Tailwind CSS v4** — styling
- **React Router** — navigation between modules
- **Zustand** — state management, with a `persist` middleware writing through
  a storage abstraction layer (see below)
- **Recharts** — progress and finance charts
- **lucide-react** — icons

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

## Storage architecture

All app data (tasks, notes, events, habits, finances, etc.) currently persists
in the browser's `localStorage`, namespaced under the `dashboard:` prefix.

This is intentionally abstracted behind a single interface so it can be
swapped for a real backend (e.g. Supabase) later **without touching any
feature code**:

- `src/lib/storage/types.ts` — the `StorageAdapter` interface every backend
  must implement (`getItem` / `setItem` / `removeItem`)
- `src/lib/storage/localStorageAdapter.ts` — today's implementation
- `src/lib/storage/index.ts` — the single export every store imports from

To migrate later: write a new adapter (e.g. `supabaseAdapter.ts`) implementing
the same interface, and change one import line in `index.ts`. Every Zustand
store in the app already reads/writes through this layer via `persist`, so
nothing else needs to change.

## Mobile-first & PWA

The app is built mobile-first: base styles target phones, with `md:` overrides
layering in the desktop experience (sidebar, denser controls) at 768px+.

- **Navigation** — bottom tab bar on mobile, collapsible sidebar on desktop/tablet-landscape.
- **Touch targets** — interactive controls are 44px+ on mobile (`Button`, topbar icons,
  bottom nav), tightened for desktop density above the `md` breakpoint.
- **Safe areas** — `env(safe-area-inset-*)` is applied to the top bar, bottom nav, and
  outer shell so content isn't clipped by notches or the iOS/Android gesture bar.
- **Swipe gestures** — `src/components/ui/SwipeableRow.tsx` is a reusable wrapper for
  swipe-to-complete / swipe-to-delete, used by Tasks and Notes list items.
- **Performance** — every feature module is route-split with `React.lazy`, so the
  initial bundle only includes what's needed for the first screen.
- **Installable (PWA)** — a web app manifest and service worker (via `vite-plugin-pwa`)
  let the app be installed to the home screen on Android and iOS, with the app shell
  precached for offline loading. Since all data already lives in `localStorage`,
  the app is fully usable offline once installed.

To test installability locally: `npm run build && npm run preview`, then open the
preview URL — Chrome will offer an install prompt. On Vercel, this works automatically
since HTTPS is required for service workers and Vercel provides it by default.



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
