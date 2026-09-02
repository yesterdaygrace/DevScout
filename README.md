# DevScout — GitHub Developer Sourcing & Comparison Tool

> A Vue 3 app for searching, shortlisting, and comparing GitHub developers — built with Vite, Pinia, Supabase, Hono, and the GitHub API, with collections, markdown notes, comparison, and candidate scoring.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D) ![Vite](https://img.shields.io/badge/Vite-8-646CFF) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%2BRLS-3ECF8E) ![Hono](https://img.shields.io/badge/Hono-4.7-E36002) ![Tailwind](https://img.shields.io/badge/Tailwind-4.3-38BDF8)

Recruiters evaluate developers across GitHub, LinkedIn, spreadsheets, and private notes. **DevScout** treats GitHub as the source of truth and adds the missing workflow: search → shortlist → collections → notes → compare → score.

**Live demo:** demo mode runs with zero config — `npm install && npm run dev`, log in with any email/password.

## Table of Contents

- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Engineering Highlights](#engineering-highlights)
- [Data Integrity](#data-integrity)
- [Data Model](#data-model)
- [API Overview](#api-overview)
- [Roles & Permissions](#roles--permissions)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [Available Scripts](#available-scripts)
- [Documentation](#documentation)
- [Security](#security)
- [License](#license)

## Key Features

| Feature | What it does | Source |
|---|---|---|
| **GitHub Search** | Query + filters + pagination via Hono proxy, 20/page, cached 30m | `src/services/githubService.ts:searchUsers` |
| **Developer Profile** | Avatar, bio, followers, repos, activity, PR count | `src/pages/ProfilePage.vue`, `src/types/github.ts` |
| **Candidate Score** | 6 weighted factors → 0–100 + rank `Emerging→Exceptional` | `src/composables/useCandidateScore.ts` |
| **Skill Breakdown** | Aggregated language bytes across 20 repos, `Chart.js` | `src/services/githubService.ts:getSkillBreakdown` |
| **Compare** | Side-by-side 2–3 developers | `src/pages/ComparePage.vue`, `src/stores/compare.ts` |
| **Collections** | User-owned groups for pipelines | `src/pages/CollectionsPage.vue`, `src/stores/collections.ts` |
| **Notes & Tags** | Per-developer Markdown notes with tag search | `src/components/MarkdownEditor.vue`, `src/pages/NotesSearchPage.vue` |
| **Saved Searches** | Persisted queries + `filters JSONB` | `src/stores/savedSearches.ts` |
| **Dashboard & Analytics** | KPIs, recently viewed/compared, language dist., API usage | `src/pages/DashboardPage.vue`, `src/components/dashboard/*` |

## Screenshots

> Screenshots coming soon. Key areas to capture:
> - Dashboard with KPI grid, global search, recently viewed/compared, collections, and API usage widget (`src/pages/DashboardPage.vue`)
> - Search with filters and results (`src/pages/SearchPage.vue`)
> - Profile with score card + skill chart + repos (`src/pages/ProfilePage.vue`, `src/components/CandidateScoreCard.vue`)
> - Collections and markdown note editor (`src/pages/CollectionsPage.vue`, `src/components/MarkdownEditor.vue`)

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Vue 3.5 + `<script setup>`, TypeScript 6, Vite 8 | SPA framework, type safety, build + `:4000` dev server with `/api` proxy |
| | Pinia 3, Vue Router 4 | State + auth-guarded routing (`src/router/index.ts`) |
| | Tailwind CSS 4.3, Heroicons 2.2, VueUse 14 | Styling, icons, composables |
| | Chart.js 4.5 + vue-chartjs 5.3, Axios 1.17, marked 18 | Skill charts, HTTP via `/api/github`, Markdown |
| **Backend** | Hono 4.7, @hono/node-server, @hono/zod-validator, Zod 3.24 | Proxy on `:4001` — `request-id`/`logger`/`rateLimit`/`cors`, validation, OpenAPI at `/docs` |
| **Infra** | Supabase (Postgres + RLS), GitHub REST API, Vercel | Auth + 7 tables (`src/supabase/migrations.sql`), source of truth, deployment (`vercel.json`, `api/index.ts`) |
| **Quality** | Vitest 4 + jsdom, Playwright 1.6, vue-tsc 3 | Unit (`tests/unit/**`), E2E (`tests/e2e/**`), type checking |

Full versions: `package.json`, `server/package.json` → `docs/stack-versions.md`.

## System Architecture

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

Production: `vercel.json` rewrites `/api/(.*)` → `api/index.ts` → `server/src/app.ts` (`handle(app)`); SPA fallback → `/index.html`.

**Folder structure:**

```
src/
├── api/              httpClient.ts, github.ts
├── components/       ErrorBoundary, Toast, CandidateScoreCard, MarkdownEditor, dashboard/* (KPIGrid, ApiUsageWidget, RecentlyViewed…)
├── composables/      useCandidateScore, useSkillBreakdown, useGitHubApi, useDebounce, useRateLimit, useDashboardStats, useErrorHandler, useOfflineDetection, useSearchHistory, useToast
├── layouts/          DefaultLayout.vue (auth shell, nav + CommandPalette)
├── pages/            DashboardPage, SearchPage, ProfilePage, ComparePage, CollectionsPage, SavedSearchesPage, NotesSearchPage, LoginPage, AuthCallback, settings/*
├── router/           index.ts (requiresAuth guard via supabase.auth.getUser)
├── services/         supabase.ts, githubService.ts (queue+cache+rate-limit), db.ts, mock.ts (demo mode)
├── stores/           auth, shortlist, collections, savedSearches, notes, recentlyViewed, compare, ui, toast
├── supabase/         migrations.sql (7 tables + RLS + handle_new_user trigger)
├── types/            github.ts, domain.ts, search.ts
├── utils/            cache, retry, export (CSV), debug (logger)
└── App.vue / main.ts / style.css / env.d.ts
server/src/
├── app.ts            Hono app + middleware + routes + openapi.json
├── index.ts          serve() on :4001 + graceful shutdown
├── lib/cache.ts      Generic TTL+LRU cache
├── middleware/       request-id, logger, rate-limit
├── routes/           health.ts, github.ts, score.ts
└── services/         github.ts (proxyFetch + PAT), score.ts
```

Details: `docs/architecture.md`.

## Engineering Highlights

**API Proxy — hide the PAT.** SPA calls `/api/github/*`; Hono validates with Zod (`server/src/routes/github.ts`), injects `GITHUB_PAT` server-side (`server/src/services/github.ts:proxyFetch`), and returns GitHub headers/body. No secret reaches the client. — `server/src/app.ts`, `vite.config.ts:proxy`, `api/index.ts`

**Rate limiting & caching.** Client queue `MAX_CONCURRENT=10, MAX_QUEUED=50` (`src/services/githubService.ts:30`) prevents 403 bursts during 20-parallel language fetches. Client cache 30m/100-entry LRU (`CACHE_TTL=30*60*1000`); server `Cache` 30m/200 (`server/src/services/github.ts:4`, `new Cache(30*60*1000, 200)`). `x-ratelimit-remaining/limit/reset` headers tracked by `useRateLimit` + `ApiUsageWidget.vue`; warns at <20% / `isLow` <20.

**Skill breakdown.** `getSkillBreakdown(username)` fetches 50 repos, filters `!fork`, takes 20, `Promise.allSettled` over `/repos/:fullName/languages`, aggregates `Record<language, bytes>` → `{language, bytes, percentage}` sorted — tolerates per-repo failure.

**Candidate scoring.** 6 factors weighted: Repository Quality 0.20, Community Engagement 0.20, Recent Activity 0.20, Open Source Activity 0.15, Project Consistency 0.15, Language Diversity 0.10 → total 0–100, rank `>85 Exceptional · >70 Strong · >55 Solid · >40 Developing · else Emerging`, strengths `≥65` / weaknesses `<40`. — `src/composables/useCandidateScore.ts`, `server/src/services/score.ts`

**Resilience:** `src/utils/retry.ts`, `ErrorBoundary.vue` + `GlobalErrorHandler.vue`, `useOfflineDetection` + `OfflineBanner.vue`, structured `logger` (`src/utils/debug.ts`).

## Data Integrity

| Layer | Mechanism | Where |
|---|---|---|
| **Validation** | Zod schemas on Hono (`searchSchema`, `searchIssuesSchema`, `per_page 1–100`, param coercion) + debounced query guards | `server/src/routes/github.ts` |
| **Business rules** | `auth.user.id` required before any Supabase write; fork-filter, pagination caps, queue backpressure; tag `TEXT[]` correctness | `src/stores/*` |
| **Database constraints** | FK `→ profiles(id) CASCADE` on all tables; `TEXT NOT NULL`; `TEXT[]` default `{}`; `JSONB` for filters; `gen_random_uuid()` PKs | `src/supabase/migrations.sql` |
| **Authorization** | RLS `ENABLE` on 7 tables; 21 policies `auth.uid()=user_id` (`EXISTS` via parent for `collection_members`); re-runnable (`IF NOT EXISTS` / `DROP POLICY IF EXISTS`) | `src/supabase/migrations.sql:65-210` |

## Data Model

```text
auth.users ──► profiles (id PK)
                ├── shortlist (user_id FK) ── github_username
                ├── notes (user_id FK) ── github_username, content, tags[], updated_at
                ├── recently_viewed (user_id FK) ── github_username, viewed_at
                ├── saved_searches (user_id FK) ── query, filters JSONB
                └── collections (user_id FK) ── name
                      └── collection_members (collection_id FK) ── github_username

Trigger: auth.users AFTER INSERT → handle_new_user() → INSERT profiles
```

Per-user isolation — no cross-user sharing. Full DDL: `src/supabase/migrations.sql` → `docs/database.md`, `docs/er.md`.

## API Overview

Base: `/api/github/*` (Vite proxy in dev, `api/index.ts` on Vercel). Health `GET /health`, docs `GET /docs` → `GET /openapi.json`.

| Area | Method & Path | Purpose |
|---|---|---|
| Health | `GET /health` | Liveness |
| Search | `GET /api/github/search/users?q=&page=&per_page=` | Search users (Zod-validated, cached) |
| User | `GET /api/github/users/:username` | Profile |
| Repos | `GET /api/github/users/:username/repos` | Repos (50, `sort=updated`) |
| Languages | `GET /api/github/repos/:owner/:repo/languages` | Per-repo bytes |
| Languages (agg) | `GET /api/github/users/:username/languages` | Aggregated breakdown |
| Issues/PRs | `GET /api/github/search/issues?q=&per_page=` | PR count (`author:username type:pr`) |
| Score | `GET /api/score/:username` | Candidate score |
| OpenAPI | `GET /openapi.json`, `GET /docs` | Machine/human docs |

Client: `src/services/githubService.ts` (`axios.create({baseURL:'/api/github'})` + queue/cache/interceptors). — `docs/api.md`

## Roles & Permissions

DevScout is **single-role + RLS ownership** (not ADMIN/STAFF).

| Capability | Owner | Enforced by |
|---|---|---|
| Search, view profiles, scores, breakdowns | Any authenticated (or demo) user | Hono validation, no DB write |
| Shortlist add/remove | Owner only | RLS `auth.uid()=user_id` on `shortlist` |
| Notes create/edit/delete | Owner only | RLS on `notes` |
| Saved searches | Owner only | RLS on `saved_searches` |
| Collections CRUD | Owner only | RLS on `collections` |
| Collection members add/remove | Owner of parent collection | `EXISTS` RLS on `collection_members` |
| Recently viewed | Owner only | RLS `SELECT` own rows |

Demo mode (`src/services/mock.ts`) bypasses Supabase — no persistence, no cross-user leakage. Full policies: `src/supabase/migrations.sql:99-210` → `docs/security.md`.

## Getting Started

**Prerequisites:** Node ≥22, npm (or pnpm). Optional: Supabase account, GitHub PAT.

**Demo mode (zero config):**

```bash
npm install
npm run dev          # http://localhost:4000 — log in with any email/password
```

**Full dev — SPA + Hono + Supabase:**

```bash
# Terminal 1 — Hono proxy
cd server && npm install
echo "GITHUB_PAT=ghp_your_token" > .env   # no scopes needed for public data
npm run dev          # http://localhost:4001 ; curl http://localhost:4001/health

# Terminal 2 — Vite SPA (proxies /api → :4001 per vite.config.ts)
cd .. && npm install
npm run dev          # http://localhost:4000
```

**Supabase (one-time, for persistence):**

1. Create project at `supabase.com` → Settings → API → copy `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` → `cp .env.example .env` → fill.
2. SQL Editor → New query → paste entire `src/supabase/migrations.sql` → Run (7 tables + RLS + `handle_new_user`).
3. GitHub OAuth: `github.com/settings/developers` → New OAuth App → callback `https://<project>.supabase.co/auth/v1/callback` → Supabase Auth → Providers → GitHub → paste ID/Secret.
4. Restart `npm run dev` → `http://localhost:4000/login` shows "Sign in with GitHub".

## Configuration

| Variable | Location | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |
| `VITE_GITHUB_CLIENT_ID` / `VITE_GITHUB_CLIENT_SECRET` | `.env` | GitHub OAuth |
| `GITHUB_PAT` | `server/.env` | **Recommended** — server PAT (5000 req/hr) |
| `VITE_GITHUB_PERSONAL_ACCESS_TOKEN` | `.env` | Deprecated — server `GITHUB_PAT` preferred (`getGitHubToken() → null`) |
| `PORT` | `server/.env` | Hono port (default 4001) |

Without a PAT you get **60 req/hr** — skill breakdown (20 repos × 1 language call) exhausts it quickly. Set `GITHUB_PAT` in `server/.env`.

## Testing

```bash
npm run typecheck        # vue-tsc -b --noEmit
npm run test:unit        # vitest run (jsdom, tests/unit/**/*.test.ts)
npm run test:unit:watch  # vitest watch
npm run test:e2e         # playwright test (baseURL http://localhost:4000)
npm run build            # vue-tsc -b && vite build
```

Configs: `vitest.config.ts` (jsdom, `tests/unit/**`), `playwright.config.ts` (chromium, `tests/e2e/**`, `webServer: npm run dev` on `:4000`). See `docs/testing.md`.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite on `:4000` (proxies `/api` → `:4001`) |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview `dist/` |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run test:unit` / `test:unit:watch` | Vitest |
| `npm run test:e2e` | Playwright |
| `cd server && npm run dev` | Hono on `:4001` (`tsx watch --env-file=.env src/index.ts`) |

## Documentation

| Document | Purpose |
|---|---|
| `docs/README-PRD.md` | README PRD (spec, 715 lines) |
| `docs/architecture.md` | Architecture, proxy rationale, folder structure, Vercel deploy |
| `docs/frontend.md` | Vue/Pinia/Router, pages, stores, composables |
| `docs/api.md` | Endpoint reference (`/api/github/*`, `/api/score/*`) |
| `docs/database.md` | Tables, constraints, RLS, triggers |
| `docs/er.md` | ER diagram |
| `docs/security.md` | Auth, RLS, secrets, rate limiting |
| `docs/stack-versions.md` | Full dependency inventory |
| `docs/deployment.md` | Vercel + Supabase setup |
| `docs/testing.md` | Unit + E2E strategy |

Source of truth for each: `server/src/app.ts`, `src/supabase/migrations.sql`, `src/services/githubService.ts`.

## Security

- **Auth:** Supabase Auth (email/password + GitHub OAuth) → `supabase.auth.getUser()` + `router.beforeEach` guard (`src/router/index.ts:38`). Demo mock (`src/services/mock.ts`) isolated.
- **RLS:** `ENABLE ROW LEVEL SECURITY` on all 7 tables; policies `auth.uid()=user_id` (or parent `EXISTS`).
- **Secrets:** `GITHUB_PAT` in `server/.env` only; never exposed to client.
- **Validation:** Zod + `zValidator` on Hono; `per_page` capped 1–100.
- **CORS/RateLimit:** `hono/cors` (localhost origins) + `server/src/middleware/rate-limit.ts` on `/api/*`.
- **Observability:** `request-id` + structured logger, no secret logging.

→ `docs/security.md`

## License

Proprietary — internal project. For open-source publication, add a license and rotate any committed secrets.
