# Architecture

> Source PRD: `docs/README-PRD.md` §10. System diagram + folder structure are canonical in `README.md#system-architecture`.

## Overview

DevScout is a **Vite SPA + Hono proxy + Supabase** system. The browser never holds the GitHub PAT.

```text
Browser (Vite :4000)  ── /api/* proxy (vite.config.ts) ──►  Hono API (Node :4001)
 Vue 3 + Pinia + Router + Tailwind                         request-id → logger → rateLimit → cors
                                                            /health  /api/github/*  /api/score/*  /docs
                                                                   │              │
                                              ┌────────────────────┘              └────────────────────┐
                                              ▼                                                     ▼
                                   GitHub REST API (PAT via GITHUB_PAT)                  Supabase Postgres + RLS
                                   search/users, users/:login, repos, languages           Auth + 7 tables
```

In production `vercel.json` collapses both servers: `api/index.ts` → `handle(app)` from `server/src/app.ts`; SPA fallback → `/index.html`.

## Request Flow

1. **User action** — `SearchPage.vue` calls `searchUsers(q)` in `src/services/githubService.ts`.
2. **Client queue/cache** — `queuedRequest()` (`MAX_CONCURRENT=10, MAX_QUEUED=50` in `src/services/githubService.ts:30`) + 30m/100-entry LRU (`getCached/setCache`, `CACHE_TTL=30*60*1000`). Rate-limit headers `x-ratelimit-remaining/limit/reset` → `onRateLimitUpdate` → `useRateLimit` + `ApiUsageWidget.vue` (warns when <20% or `isLow` when <20 remaining).
3. **Vite proxy** — `vite.config.ts:5-14` `server.port:4000, proxy: {'/api': 'http://localhost:4001'}` forwards to Hono.
4. **Hono middleware stack** — `server/src/app.ts:15-21`: `requestId` → `logger` → `rateLimit` (`/api/*`, 60 req/60s per IP, `x-ratelimit-*` headers) → `cors` (`origin: ['http://localhost:4000', 'http://localhost:4173']`).
5. **Validation + proxy** — `server/src/routes/github.ts` Zod `zValidator` → `proxyFetch` in `server/src/services/github.ts:25-71` builds `Authorization: token <GITHUB_PAT>` (+ `User-Agent`), 30m/200-entry `Cache` (`new Cache(CACHE_TTL, 200)`), `x-cache: HIT/MISS` + `x-ratelimit-*` forwarding, returns status/headers/body verbatim.
6. **Supabase** — parallel path for persistence: Pinia stores (`src/stores/*`) → `supabase.from('shortlist|notes|collections…')` with RLS `auth.uid()=user_id`. Auth via `supabase.auth.getUser()` + `router.beforeEach` guard.

## Folder Structure

```
src/
├── api/              httpClient.ts, github.ts
├── assets/           hero.png, vite.svg
├── components/       ErrorBoundary, GlobalErrorHandler, Toast, CandidateScoreCard, MarkdownEditor, OfflineBanner, Skeleton*, dashboard/* (KPIGrid, ApiUsageWidget, RecentlyViewed, RecentlyCompared, InsightsPanel, SearchAnalytics, LanguageDistribution, ActivityFeed, GlobalSearchBar, RecentCollections, QuickActions, GreetingSection, EmptyState, UpgradeCard)
├── composables/      useCandidateScore, useSkillBreakdown, useGitHubApi, useDebounce, useRateLimit, useDashboardStats, useErrorHandler, useOfflineDetection, useSearchHistory, useToast
├── layouts/          DefaultLayout.vue (auth-guarded shell, nav + CommandPalette)
├── pages/            DashboardPage, SearchPage, ProfilePage, ComparePage, CollectionsPage, SavedSearchesPage, NotesSearchPage, LoginPage, AuthCallback, settings/{ProfileSettings,ApiSettings,AppearanceSettings}
├── router/           index.ts (createRouter + beforeEach requiresAuth)
├── services/         supabase.ts, githubService.ts, db.ts, mock.ts
├── stores/           auth, shortlist, collections, savedSearches, notes, recentlyViewed, compare, ui, toast
├── supabase/         migrations.sql (7 tables + RLS + handle_new_user)
├── types/            github.ts (GitHubUser, GitHubRepo…), domain.ts (Note, SavedSearch…), search.ts
├── utils/            cache, retry, export (CSV), debug (logger)
└── App.vue / main.ts / style.css / env.d.ts
server/src/
├── app.ts            Hono app + middleware + routes + openapi.json (/docs → swaggerUI, /openapi.json)
├── index.ts          serve(fetch, port: PORT||4001) on :4001 + SIGTERM/SIGINT handlers
├── lib/cache.ts      Generic Cache<T> (TTL+LRU, default 5m/100, used as 30m/200 in github.ts)
├── middleware/       request-id.ts, logger.ts, rate-limit.ts (60 req/60s per IP → 429 + retry-after)
├── routes/           health.ts (status+uptime+rateLimit), github.ts (6 proxy routes + Zod), score.ts (proxy+calculateScore)
└── services/         github.ts (proxyFetch + getRateLimit, Cache 30m/200, token <PAT>), score.ts (calculateScore 0-100)
api/index.ts          Vercel adapter: handle(app as unknown as …) via @hono/node-server/vercel
```

## Key Decisions

| Decision | Why | Alternative rejected |
|---|---|---|
| **Hono proxy** instead of direct GitHub calls | Hide PAT, add Zod validation, server cache, single OpenAPI surface, CORS control | Direct client PAT exposes secret, no validation |
| **Vite proxy in dev, Vercel handle in prod** | Same API contract locally and deployed; no env branching | Separate backend URL per env adds config drift |
| **Pinia per-domain stores** | Each table maps to a store (`shortlist`, `notes`…); isolated loading/toast logic, testable | Single mega-store couples unrelated domains |
| **Client queue + cache** | GitHub 60→5000 req/hr constraint; skill breakdown fans out 20× languages — without queue hits 403 | No queue → 403 bursts, no cache → redundant nav fetches |
| **Supabase RLS over app-level RBAC** | Per-user isolation is the entire authz model; DB enforces even if client compromised | App-only checks bypassable |

## Deployment

- **Vercel** — `vercel.json`: `{"/api/(.*)": "/api/index", "/((?!api/).*)": "/index.html"}`. Build: `npm run build` (`vue-tsc -b && vite build`) → `dist/`.
- **Supabase** — managed Postgres, no Docker. Migrations via SQL Editor paste of `src/supabase/migrations.sql`.
- **PAT rotation** — `GITHUB_PAT` in `server/.env` (dev) and Vercel env (prod); client `VITE_GITHUB_PERSONAL_ACCESS_TOKEN` deprecated.

Further: `docs/deployment.md`, `docs/security.md`.
