# README.md Product Requirements Document

## 1. Product

**Product:** DevScout — GitHub Developer Sourcing & Comparison Tool
**Repository:** DevScout
**Document Type:** README Product Requirements Document
**Target:** GitHub visitors, recruiters, hiring managers, frontend/full-stack engineers, and project maintainers

## 2. Objective

Create a concise, technically credible README that allows a reader to understand DevScout within 2–5 minutes and determine:

1. What DevScout does (sourcing workflow on top of GitHub as source of truth).
2. What technologies are used (Vue 3 SPA + Hono proxy + Supabase).
3. How the system is architected (Vite SPA → Hono API proxy → GitHub API + Supabase PostgreSQL).
4. How data is modeled and protected (Supabase RLS, FK constraints, per-user isolation).
5. How authentication and rate-limiting are implemented (Supabase Auth + demo mode + PAT/queue/cache).
6. How candidate scoring and skill breakdown work.
7. How to run the project locally (demo mode zero-config + Supabase full mode).
8. Where to find deeper technical documentation (architecture, database, API, stack versions).

The README must demonstrate engineering maturity without becoming a replacement for documentation in `docs/` and inline code references.

## 3. Primary Goals

### G1. Communicate the project immediately

The first screen should communicate:

- Project name: **DevScout**.
- One-sentence product description: *A Vue 3 app for searching, shortlisting, and comparing GitHub developers — with Supabase persistence, GitHub API integration, and recruiter workflow tools.*
- Core technologies: Vue 3, Vite, Pinia, Supabase, Hono, GitHub API, Tailwind CSS.
- Major business capabilities: search with filters, profile scoring, side-by-side compare, collections, saved searches, markdown notes with tags, recently viewed, dashboard analytics.
- One or two representative screenshots (dashboard + search/profile).
- Project status + demo-mode callout (no Supabase required to try).

### G2. Demonstrate frontend + integration engineering depth

The README must clearly communicate:

- Vue 3 Composition API + `<script setup>` + Pinia + Vue Router.
- Vite 8 + TypeScript 6 + Tailwind CSS v4 + Heroicons + VueUse.
- Supabase as auth + PostgreSQL persistence with Row Level Security.
- Hono Node proxy (`server/src/app.ts`) with request-id / logger / rate-limit / CORS + OpenAPI (`/docs`, `/openapi.json`).
- GitHub API integration with server-side PAT (`GITHUB_PAT`), client queue (`MAX_CONCURRENT=10`, `MAX_QUEUED=50` in `src/services/githubService.ts`), 30-min client cache + 5-min server cache (`server/src/lib/cache.ts`), and rate-limit header tracking + low-limit warnings.
- Candidate scoring (6 weighted factors → rank) in `src/composables/useCandidateScore.ts` + server `server/src/services/score.ts`.
- Skill breakdown aggregation (`Promise.allSettled` over up to 20 non-fork repos, per-repo `/languages` fetch) in `src/services/githubService.ts` + `src/composables/useSkillBreakdown.ts`.
- Pinia stores for domain state (`src/stores/auth|shortlist|collections|savedSearches|notes|recentlyViewed|compare`) + composables + utils (`src/utils/cache|retry|export|debug`).

### G3. Demonstrate production-minded engineering

Show evidence of:

- Vite dev server on `:4000` with `/api` proxy to Hono on `:4001` (`vite.config.ts`).
- Vercel deployment with rewrites (`vercel.json`: `/api/(.*)` → `/api/index`, SPA fallback to `/index.html`; `api/index.ts` bridges to `server/src/app.ts`).
- Environment-based configuration (`.env.example` + `server/.env` + `src/env.d.ts`).
- Zod validation on the Hono layer (`server/src/routes/github.ts` with `zValidator`).
- Centralized error handling (`src/components/GlobalErrorHandler.vue`, `ErrorBoundary.vue`) + structured logging (`src/utils/debug.ts`, `server/src/middleware/logger.ts`).
- Vitest unit tests (`vitest.config.ts` jsdom, `tests/unit/**`) + Playwright E2E (`playwright.config.ts`, `tests/e2e/**`).
- Type safety (`vue-tsc -b`, `npm run typecheck`).
- Offline handling (`src/components/OfflineBanner.vue`, `useOfflineDetection.ts`).
- Data export utilities (`src/utils/export.ts` for CSV).

### G4. Maintain fast readability

A reader should be able to scan the README without reading every paragraph.

Use:

- Tables (stack, routes, env vars, scripts).
- Short paragraphs.
- Bullet points.
- Diagrams (architecture + ER).
- Code blocks only where necessary (quick start, env, curl).
- Links to detailed documentation.

Avoid excessive implementation details in the main README — link to source files and `docs/` instead.

## 4. Target Audience

### Primary

**Recruiters / Hiring Managers / Engineering Managers**

They need to understand in 60s: what DevScout solves (fragmented sourcing across GitHub/LinkedIn/spreadsheets), how collections/notes/compare/scoring accelerate evaluation, and that it treats GitHub as source of truth.

### Secondary

**Frontend / Full-Stack Engineers**

They need in ~3 min: SPA architecture, Hono proxy reason (hide PAT, add rate-limit/cache/validation), Supabase RLS model, scoring/skill-breakdown algorithms, folder structure, startup commands, and testing approach.

### Tertiary

**Project Maintainers / Contributors**

They need: exact install steps, demo vs Supabase modes, env contract, migration instructions, script reference, and doc destinations.

## 5. Information Architecture

The README should contain the following sections in order:

1. Header (title + pitch + badges)
2. Why I Built This / Key Features (6–8 capabilities)
3. Screenshots / Demo
4. Tech Stack (table backend/frontend/infra)
5. System Architecture (diagram + folder structure)
6. Engineering Highlights (proxy, rate-limit/cache, scoring, skill breakdown)
7. Data Integrity (validation → RLS → constraints)
8. Data Model (ER diagram + migration reference)
9. API Overview (base path, health, docs, endpoint groups)
10. Roles & Permissions (RLS ownership model)
11. Getting Started (demo mode + Supabase full mode)
12. Configuration (env vars)
13. Testing (unit + E2E)
14. Available Scripts (npm)
15. Documentation Map
16. Security
17. License

The Table of Contents should link only to major sections.

## 6. Header Requirements

The header must contain:

**Title**

`DevScout — GitHub Developer Sourcing & Comparison Tool`

**Pitch**

A single sentence describing the system. Canonical:

> A Vue 3 app for searching, shortlisting, and comparing GitHub developers — built with Vite, Pinia, Supabase, Hono, and the GitHub API, with collections, markdown notes, comparison, and candidate scoring.

The pitch must name Vue 3, Supabase, and GitHub API (not Go/PostgreSQL/inventory).

**Badges (optional but recommended)**

`Vue 3` `Vite` `TypeScript` `Supabase` `Hono` `GitHub API` `Tailwind CSS` — badges must not replace the stack table or architecture explanation.

## 7. Key Features

Display 6–8 capabilities that demonstrate product + engineering depth.

Required candidates (group as cards or bullets):

- **GitHub Search** — query + filters + pagination, via Hono proxy to `/search/users` (20 per page) with caching.
- **Developer Profile** — full `GitHubUser` detail + repos + followers/activity metadata, cached per username.
- **Candidate Score** — 6 factors weighted (Repository Quality 20%, Community Engagement 20%, Recent Activity 20%, Open Source Activity 15%, Project Consistency 15%, Language Diversity 10%) → total 0–100 + rank `Emerging → Exceptional` (see `src/composables/useCandidateScore.ts` + `server/src/services/score.ts`).
- **Skill Breakdown** — aggregated language bytes across up to 20 non-fork repos (`getSkillBreakdown`, `Chart.js` + `vue-chartjs`).
- **Collections** — user-owned groups (`collections` + `collection_members` tables) for role-based pipelines.
- **Shortlist** — per-user `shortlist` table; quick add/remove with toast feedback (`src/stores/shortlist.ts`).
- **Notes with Tags & Markdown** — per-developer private notes with tags array + `updated_at`, markdown editor with preview (`MarkdownEditor.vue`), full-text search page (`NotesSearchPage.vue`).
- **Saved Searches** — persisted `saved_searches` with `query` + `filters JSONB`.
- **Compare** — side-by-side of 2–3 developers (`src/pages/ComparePage.vue`, `src/stores/compare.ts`).
- **Dashboard & Analytics** — KPIs, recently viewed, recent collections/searches, language distribution, API usage widget (`src/components/dashboard/*`, `src/composables/useDashboardStats.ts`).
- **Recently Viewed** — auto-tracked `recently_viewed` table.
- **CSV Export** — via `src/utils/export.ts`.

Prioritize features that show the recruiter workflow is the product — not just another GitHub UI.

## 8. Screenshots

Display two strong screenshots near the top:

- **Dashboard** — greeting + KPI grid + global search bar + recently viewed/compared/collections + activity feed.
- **Search or Profile** — search filters + results, or profile with score card + skill chart + repos.

Required captions: what the screenshot proves (e.g., "Dashboard — KPIs, collections, recently viewed, and API usage in one place. Source: `src/pages/DashboardPage.vue`").

If screenshots are not yet captured, keep an explicit placeholder checklist in the README:

```
> Screenshots coming soon. Key areas to capture:
> - Dashboard with stats overview and shortlist
> - Search with advanced filters and results
> - Profile page with repository insights and candidate score
```

Optional additional screenshots (collections, notes editor, compare, settings) should be moved lower or to `docs/`.

## 9. Tech Stack

Use a compact table divided into three tiers. Values below are authoritative — sourced from `package.json` and `server/package.json`.

### Frontend

| Technology | Version (pinned) | Purpose | Reference |
|---|---|---|---|
| Vue 3 | `^3.5.34` | UI framework (Composition API + `<script setup>`) | `src/App.vue`, `src/main.ts` |
| TypeScript | `~6.0.2` | Type safety | `tsconfig.json`, `src/env.d.ts` |
| Vite | `^8.0.12` | Build + dev server (proxy) | `vite.config.ts` |
| Pinia | `^3.0.4` | State management | `src/stores/*` |
| Vue Router | `^4.6.4` | Routing + auth guard | `src/router/index.ts` |
| Tailwind CSS | `^4.3.1` | Styling | `src/style.css`, `@tailwindcss/vite` |
| Chart.js + vue-chartjs | `^4.5.1` / `^5.3.3` | Skill breakdown charts | `src/composables/useSkillBreakdown.ts` |
| Axios | `^1.17.0` | HTTP client (via `/api/github`) | `src/services/githubService.ts` |
| Heroicons | `^2.2.0` | SVG icons | `src/components/*` |
| VueUse | `^14.3.0` | Utility composables | `src/composables/*` |
| marked | `^18.0.7` | Markdown rendering | `MarkdownEditor.vue` |

### Backend (Hono Proxy)

| Technology | Version | Purpose | Reference |
|---|---|---|---|
| Hono | `^4.7.0` | API proxy server | `server/src/app.ts` |
| @hono/node-server | `^1.13.0` | Node adapter | `server/src/index.ts` |
| @hono/zod-validator | `^0.4.0` | Query validation | `server/src/routes/github.ts` |
| @hono/swagger-ui | `^0.5.0` | OpenAPI docs at `/docs` | `server/src/app.ts` |
| Zod | `^3.24.0` | Schema validation | `server/src/routes/*` |

### Infrastructure

| Technology | Purpose | Reference |
|---|---|---|
| Supabase | Auth + PostgreSQL + RLS | `src/services/supabase.ts`, `src/supabase/migrations.sql` |
| PostgreSQL (via Supabase) | Persistence (7 tables) | `src/supabase/migrations.sql` |
| GitHub REST API | Source of truth for profiles/repos/languages | `server/src/services/github.ts` |
| Vercel | Deployment (serverless + SPA fallback) | `vercel.json`, `api/index.ts` |
| Vitest + jsdom | Unit testing | `vitest.config.ts`, `tests/unit/**` |
| Playwright | E2E testing | `playwright.config.ts`, `tests/e2e/**` |
| vue-tsc | Type checking | `package.json: typecheck` |

Do not list every transitive dependency. Complete version inventory belongs in `docs/stack-versions.md`.

## 10. System Architecture

The README must contain one high-level architecture diagram + one folder-structure map.

**Required flow diagram:**

```text
                    ┌─────────────────┐
                    │   Browser (Vite SPA on :4000) │
                    │  Vue 3 + Pinia + Router + Tailwind  │
                    └────────┬────────┘
                             │  /api/* proxy (vite.config.ts)
                             ▼
                    ┌─────────────────┐
                    │  Hono API (Node on :4001) │
                    │  request-id → logger → rateLimit → cors    │
                    │  /health  /api/github/*  /api/score/*  /docs│
                    └──────┬──────────┬───────┘
                           │          │
              ┌────────────┘          └────────────┐
              ▼                                    ▼
   ┌──────────────────┐                ┌──────────────────┐
   │  GitHub REST API │ (PAT via      │ Supabase         │
   │  search/users,   │  GITHUB_PAT) │ PostgreSQL + RLS │
   │  users/:login,   │                │ Auth + 7 tables  │
   │  repos, languages│                └──────────────────┘
   └──────────────────┘
```

In production, `vercel.json` collapses the two servers: `api/index.ts` handles `/api/(.*)` via `@hono/node-server/vercel` → `server/src/app.ts`; SPA fallback serves `/index.html`.

**Folder structure (required in README, keep concise):**

```
DevScout/
├── src/
│   ├── api/              # http client (httpClient.ts, github.ts)
│   ├── assets/           # hero.png, vite.svg
│   ├── components/       # ErrorBoundary, Toast, CandidateScoreCard, MarkdownEditor, dashboard/*
│   ├── composables/      # useCandidateScore, useSkillBreakdown, useGitHubApi, useDebounce, useRateLimit
│   ├── layouts/          # DefaultLayout.vue (auth-guarded shell)
│   ├── pages/            # DashboardPage, SearchPage, ProfilePage, ComparePage, CollectionsPage, SavedSearchesPage, NotesSearchPage, LoginPage, AuthCallback + settings/*
│   ├── router/           # index.ts (requiresAuth guard via supabase.auth.getUser)
│   ├── services/         # supabase.ts, githubService.ts, db.ts, mock.ts
│   ├── stores/           # auth, shortlist, collections, savedSearches, notes, recentlyViewed, compare, ui, toast
│   ├── supabase/         # migrations.sql (7 tables + RLS + trigger)
│   ├── types/            # github.ts, domain.ts, search.ts
│   ├── utils/            # cache, retry, export (CSV), debug (logger), ...
│   ├── App.vue / main.ts / style.css
│   └── env.d.ts
├── server/               # Hono proxy — standalone Node service
│   ├── src/
│   │   ├── app.ts        # Hono app, middleware, routes, openapi
│   │   ├── index.ts      # serve() on :4001 + graceful shutdown
│   │   ├── lib/cache.ts  # Generic TTL+LRU cache
│   │   ├── middleware/   # request-id, logger, rate-limit
│   │   ├── routes/       # health.ts, github.ts, score.ts
│   │   └── services/     # github.ts (proxyFetch + PAT), score.ts (calculateScore)
│   └── .env              # GITHUB_PAT=...
├── api/index.ts          # Vercel adapter: handle(app)
├── public/
├── tests/                # unit/ + e2e/
├── vite.config.ts        # :4000 + /api proxy → :4001
├── vercel.json           # /api rewrites + SPA fallback
├── vitest.config.ts / playwright.config.ts
└── .env.example          # SUPABASE + GitHub OAuth + PAT
```

Mention shared infrastructure separately. Detailed rationale belongs in `docs/architecture.md` (or current `README.md`'s Project Structure section expanded).

## 11. Engineering Highlights

Create a dedicated section explaining the project's most important engineering decisions. Link each claim to a source file.

### API Proxy Architecture (why Hono)

Client never holds the GitHub PAT. The Vite SPA calls `/api/github/*`; Hono validates (`zod`), injects `GITHUB_PAT` server-side, proxies to `https://api.github.com`, and returns GitHub's headers/body transparently. This hides the secret, enables server cache/rate-limit, and gives a single OpenAPI surface. References: `server/src/app.ts`, `server/src/services/github.ts`, `server/src/routes/github.ts`, `vite.config.ts: proxy`, `api/index.ts`.

### Rate Limiting & Caching

- **Client queue:** `src/services/githubService.ts` — `MAX_CONCURRENT=10`, `MAX_QUEUED=50`, `queuedRequest()` serializes bursts; `Request queue full` error if exceeded. Prevents accidental 403s during skill-breakdown fan-out (20 parallel language fetches).
- **Client cache:** 30-min TTL, 100-entry LRU in GitHub service (`getCached/setCache`), keys `search:*`, `user:*`, `repos:*`, `lang:*`. Drives instant back-navigation.
- **Server cache:** `server/src/lib/cache.ts` generic `Cache<T>` (default 5-min TTL, 100 entries) used by GitHub proxy.
- **Header tracking:** `x-ratelimit-remaining/limit/reset` emitted to `useRateLimit` composable; warns when <20% remains (`ApiUsageWidget.vue`); 403 retry-after handling. Reference: `src/composables/useRateLimit.ts`, `src/components/dashboard/ApiUsageWidget.vue`.

### Skill Breakdown

Fetch `GET /users/:username/repos?per_page=50&sort=updated`, filter `!fork`, slice 20, `Promise.allSettled` over `GET /repos/:owner/:repo/languages`, aggregate `Record<language, bytes>`, compute `percentage = bytes/total*100` (1 decimal), sort descending. Tolerates per-repo failures. References: `src/services/githubService.ts:getSkillBreakdown`, `server/src/routes/github.ts:/languages`, `src/composables/useSkillBreakdown.ts`.

### Candidate Scoring

6 factors → weighted total 0–100 + rank color + strengths/weaknesses. Weights: Repository Quality 0.20 (totalStars + avgStars + topRepo + forkRatio), Community Engagement 0.20 (followers/following ratio), Recent Activity 0.20 (3mo vs 6mo updated_at buckets), Open Source Activity 0.15 (original ratio), Project Consistency 0.15 (publicRepos + description ratio), Language Diversity 0.10 (unique languages). Thresholds documented in code; ranks `>85 Exceptional, >70 Strong, >55 Solid, >40 Developing, else Emerging`. References: `src/composables/useCandidateScore.ts`, `server/src/services/score.ts`, `CandidateScoreCard.vue`.

### State & Data Flow

Pinia stores own persistence (Supabase) + loading flags + toasts; composables own derived logic; router guard (`supabase.auth.getUser`) gates `requiresAuth` routes; `DefaultLayout.vue` provides nav + command palette. References: `src/stores/*`, `src/router/index.ts:38-58`, `src/layouts/DefaultLayout.vue`, `src/components/CommandPalette.vue`.

### Resilience

`src/utils/retry.ts` for GitHub transient failures; `ErrorBoundary.vue` + `GlobalErrorHandler.vue` for render/API errors; `useOfflineDetection` + `OfflineBanner.vue`; structured logger with levels (`src/utils/debug.ts`). All user-facing mutations surface via `useToastStore`.

The README should explain **why** each mechanism exists, not dump line numbers beyond the file-level references above.

## 12. Data Integrity

This is a high-priority section. It must communicate four layers of protection specific to DevScout:

### 1. Client Validation

- Zod schemas on every Hono ingestion point (`server/src/routes/github.ts: searchSchema`, `searchIssuesSchema`, param coercion).
- Client-side `validator`-style checks in forms: `React Hook Form + Zod` in the original Inventra doc is replaced here by `src/components/MarkdownEditor.vue` and search input debouncing (`useDebounce`) + query guards.

### 2. Service / Business Rules

Pinia stores enforce per-user ownership before any Supabase mutation (`useAuthStore().user.id` required). Business rules include: `MAX_QUEUED` backpressure, fork-filter for scoring/breakdown, pagination caps (`per_page` 1–100 validated), recently-viewed deduplication behavior.

### 3. Database Constraints

`src/supabase/migrations.sql` is the contract. Required in README as a table:

| Table | Constraints & References | Notes |
|---|---|---|
| `profiles` | `id UUID PK → auth.users(id) CASCADE` | trigger `handle_new_user()` auto-creates on signup |
| `shortlist` | `id PK + user_id FK → profiles CASCADE + github_username NOT NULL` | one row per favorited developer per user |
| `notes` | `id PK + user_id FK CASCADE + tags TEXT[] + updated_at` | markdown content, tag filtering |
| `recently_viewed` | `id PK + user_id FK CASCADE + viewed_at` | append-only viewing history |
| `saved_searches` | `id PK + user_id FK CASCADE + query TEXT NOT NULL + filters JSONB` | reusable queries |
| `collections` | `id PK + user_id FK CASCADE + name` | user-owned groups |
| `collection_members` | `id PK + collection_id FK → collections CASCADE + github_username` | membership, RLS via parent collection |
| FK + CASCADE everywhere ensures orphan cleanup.

Indexes: PK btree by default; `user_id` filtered reads rely on FK indexes (Supabase default). JSONB filters are schemaless but stored atomically.

### 4. Authorization & Concurrency Controls

- **Row Level Security (RLS)** enabled on all 7 tables; 15+ policies of form `auth.uid() = user_id` (or `EXISTS` via parent collection for `collection_members`). Every `select/insert/update/delete` is scoped.
- No row-level locking needed — DevScout has no contending inventory ledger; per-user rows eliminate write conflicts. Idempotency is delegated to Supabase + client cache.
- Migrations are safe to re-run (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` then re-create).

Avoid listing trigger function line numbers. Detailed columns/policies belong in `docs/database.md` + `docs/er.md`.

## 13. Data Model

Include a simplified ER diagram showing major relationships (replace Inventra's inventory diagram):

```text
auth.users
   └── profiles (id PK)
         ├── shortlist (user_id FK) ── github_username
         ├── notes (user_id FK) ── github_username, content, tags[]
         ├── recently_viewed (user_id FK) ── github_username, viewed_at
         ├── saved_searches (user_id FK) ── query, filters JSONB
         └── collections (user_id FK) ── name
               └── collection_members (collection_id FK) ── github_username

Supabase Auth trigger:
  auth.users ──AFTER INSERT──► handle_new_user() ──INSERT──► profiles
```

Conceptual note: DevScout is **per-user isolated** — there is no cross-user sharing, no Role→Permission hierarchy. A future `docs/er.md` can expand column types and `collection_members` RLS via `EXISTS (select 1 from collections where id=collection_id and user_id=auth.uid())`.

Detailed columns, indexes, constraints, and full migration belong in `src/supabase/migrations.sql`, `docs/database.md`, `docs/er.md`.

## 14. API Overview

Provide base path, health, docs, and representative endpoint groups — not every query param.

**Base path:** `/api/github/*` (proxied via Vite in dev, via `api/index.ts` in Vercel). Health at `/health`. Docs at `/docs` → `/openapi.json`.

| Area | Method | Path | Purpose | Source |
|---|---|---|---|---|
| Health | GET | `/health` | Liveness | `server/src/routes/health.ts` |
| Search | GET | `/api/github/search/users?q=&page=&per_page=` | Search GitHub users (validated, cached) | `server/src/routes/github.ts` |
| User | GET | `/api/github/users/:username` | Get profile | same |
| Repos | GET | `/api/github/users/:username/repos` | List repos (50, sorted) | same |
| Languages | GET | `/api/github/repos/:owner/:repo/languages` | Per-repo bytes | same |
| Languages (agg) | GET | `/api/github/users/:username/languages` | Aggregated breakdown | same |
| Issues/PRs | GET | `/api/github/search/issues?q=&per_page=` | Author PR count | same |
| Score | GET | `/api/score/:username` | Candidate score (proxy+compute) | `server/src/routes/score.ts` |
| OpenAPI | GET | `/openapi.json` / `/docs` | Machine/human docs | `server/src/app.ts` |

**Client usage:** `src/services/githubService.ts` (`searchUsers`, `getUser`, `getUserRepos`, `getRepoLanguages`, `getUserPRs`, `getSkillBreakdown`) calls `axios.create({ baseURL: '/api/github' })` with interceptors for rate-limit + queue.

Complete endpoint documentation belongs in `docs/api.md` (generated from `server/src/app.ts: openapi.json`).

## 15. Roles & Permissions

Show the actual authorization model — **not Inventra's ADMIN/STAFF matrix**.

**DevScout is single-role + RLS ownership:**

| Capability | Who | How enforced |
|---|---|---|
| Search GitHub users, view profiles, compute scores/breakdowns | Any authenticated user (or demo user) | Hono validation; no DB write |
| Shortlist / Un-shortlist | Owner only | RLS `auth.uid() = user_id` on `shortlist` |
| Create/edit/delete notes (with tags) | Owner only | RLS on `notes` (CRUD own rows) |
| Save / delete searches | Owner only | RLS on `saved_searches` |
| Create/update/delete collections | Owner only | RLS on `collections` |
| Add/remove collection members | Member of own collection | `EXISTS` RLS on `collection_members` via parent `collections.user_id` |
| View recently viewed | Owner only | RLS `SELECT` own rows |
| Public GitHub data | Anyone (rate-limited) | No RLS — proxied GitHub API |

Demo mode bypasses Supabase entirely (`src/services/mock.ts`, `src/stores/auth.ts` demo branch) — no persistence, no RLS checks, no cross-demo leakage.

The complete RLS policy list belongs in `docs/security.md` + `src/supabase/migrations.sql:94-210`.

## 16. Getting Started

The README must provide two working quick-start paths — **demo (zero-config)** and **full (Supabase + PAT)** — that reflect the actual repository commands.

### Prerequisites

- Node.js ≥ 22 (Vite 8 + Vue 3.5 requirement)
- npm (or pnpm — repo has both `package-lock.json` and `pnpm-lock.yaml`)
- Optional: Supabase account (for persistence), GitHub PAT (for 5,000 req/hr)

### Quick Start — Demo Mode (no Supabase)

```bash
npm install
npm run dev          # SPA on http://localhost:4000
# Terminal B will be auto-proxied if server is needed, otherwise demo data suffices
# Log in with any email/password — demo auth is mocked (no Supabase needed)
```

Demo mode behavior: `src/services/supabase.ts` with empty env → `mock.ts` branch; `src/stores/auth.ts` accepts any credentials; no RLS writes.

### Full Development — SPA + Hono + Supabase

Terminal 1 — Hono proxy (port 4001):

```bash
cd server
npm install
# optional but recommended:
echo "GITHUB_PAT=ghp_your_token_here" > .env   # no scopes needed for public data
npm run dev   # tsx watch --env-file=.env src/index.ts → http://localhost:4001
curl http://localhost:4001/health   # {"status":"ok"} (see server/src/routes/health.ts)
```

Terminal 2 — Vite SPA (port 4000, proxies `/api` → 4001 per `vite.config.ts`):

```bash
npm install          # from repo root
npm run dev          # Vite on http://localhost:4000, proxies /api → 4001
```

### Supabase Setup (for real auth & persistence)

Exactly as in current `README.md` § "Supabase Setup" — copy here without drift:

1. Create project at supabase.com.
2. Copy `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from Settings → API into `.env` (from `.env.example`).
3. SQL Editor → New query → paste entire `src/supabase/migrations.sql` → Run (creates `profiles`, `shortlist`, `notes`, `recently_viewed`, `saved_searches`, `collections`, `collection_members` + RLS + `handle_new_user` trigger).
4. Enable GitHub OAuth: GitHub OAuth App (`https://github.com/settings/developers`) with callback `https://<your-project>.supabase.co/auth/v1/callback` → Supabase Auth → Providers → GitHub → paste Client ID/Secret → Save.
5. Restart `npm run dev` and verify `http://localhost:4000/login` shows "Sign in with GitHub".

Local dev order: start PostgreSQL (managed by Supabase), configure `.env`, run migrations (one-time), seed not required (per-user data), start backend, start frontend. The instructions must reflect actual commands — no `make docker-up` / `make seed` / `healthz`.

## 17. Configuration

Show only important environment variables, sourced from `.env.example` and `server/.env`.

| Variable | Required | Location | Purpose | Example |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | For persistence | `.env` | Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | For persistence | `.env` | Supabase anon public key | `eyJhbG...` |
| `VITE_GITHUB_CLIENT_ID` | For GitHub OAuth | `.env` | GitHub OAuth App client ID | `Iv1.abc...` |
| `VITE_GITHUB_CLIENT_SECRET` | For GitHub OAuth | `.env` | GitHub OAuth App secret | `…` |
| `VITE_GITHUB_PERSONAL_ACCESS_TOKEN` | No (client-side deprecated) | `.env` | Legacy field — PAT is now server-side preferred | `ghp_…` |
| `GITHUB_PAT` | **Recommended** | `server/.env` | Server GitHub PAT (5000 req/hr) | `ghp_…` |
| `PORT` | No (default 4001) | `server/.env` | Hono port | `4001` |
| Auth demo mode | Automatic | — | When Supabase env absent, app runs fully mocked | — |

Clearly warn: default GitHub rate without PAT is **60 req/hour**. Skill breakdown (20 repos × 1 language call each) exhausts that quickly — include the `⚠️ Without a token you'll hit 60 req/hour` notice from current README.

Complete reference may remain in `docs/deployment.md`.

## 18. Testing

Explain unit, E2E, and type checking as they actually exist:

- **Unit tests:** Vitest + jsdom + Vue Test Utils (`vitest.config.ts` includes `tests/unit/**/*.test.ts`), command `npm run test:unit` / `test:unit:watch`. Example suites should cover `useCandidateScore`, `useSkillBreakdown`, Pinia stores, and `utils/retry|cache`.
- **E2E tests:** Playwright (`playwright.config.ts`, `tests/e2e/**`, `baseURL: http://localhost:4000`, webServer `npm run dev`), command `npm run test:e2e`. HTML reporter, screenshot/trace on failure.
- **Type check:** `npm run typecheck` → `vue-tsc -b --noEmit`; `npm run build` does `vue-tsc -b && vite build`.
- **Lint:** `npm run lint` is currently an alias to typecheck (no ESLint configured) — document honestly, note opportunity to add `eslint`.

Example commands:

```bash
npm run typecheck      # vue-tsc
npm run test:unit       # vitest run
npm run test:unit:watch # vitest watch
npm run test:e2e        # playwright test
npm run build           # typecheck + vite build
npm run preview         # preview dist
```

Link to `docs/testing.md` for strategy, coverage expectations, and CI notes (GitHub Actions + govulncheck not yet configured — document as roadmap if absent).

## 19. Available Scripts

Display only commonly useful commands, sourced from `package.json` (root + `server/package.json`).

**Root (`DevScout/package.json`)**

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :4000 (proxies /api → :4001) |
| `npm run build` | `vue-tsc -b && vite build` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | `vue-tsc -b --noEmit` |
| `npm run test:unit` | Vitest run (jsdom) |
| `npm run test:unit:watch` | Vitest watch |
| `npm run test:e2e` | Playwright E2E |

**Proxy (`server/package.json`)**

| Command | Purpose |
|---|---|
| `npm run dev` | `tsx watch --env-file=.env src/index.ts` on :4001 |

Do not invent Make targets (`make build`, `make migrate-up`, etc.) — DevScout uses npm. If a Makefile exists in future, document it then.

## 20. Security

Summarize the major security mechanisms that accurately reflect DevScout:

- **Supabase Auth:** email/password + GitHub OAuth (PKCE via Supabase); session managed by `@supabase/supabase-js`, guarded by `router.beforeEach` checking `supabase.auth.getUser()`.
- **Row Level Security:** all 7 tables `ENABLE ROW LEVEL SECURITY`; policies enforce `auth.uid() = user_id` (or parent-collection ownership); no cross-user reads.
- **Secret handling:** GitHub PAT lives only in `server/.env` (`GITHUB_PAT`), never exposed to client; client `VITE_GITHUB_PERSONAL_ACCESS_TOKEN` is deprecated and ignored (`getGitHubToken() → null`).
- **Input validation:** Zod on Hono (`zValidator`) + query param coercion (`per_page` 1–100) + username param sanity.
- **CORS:** `hono/cors` restricted to `http://localhost:4000` + `4001` style origins (tighten for production).
- **Rate limiting:** `server/src/middleware/rate-limit.ts` on `/api/*` + client queue backpressure + `retry.ts` with backoff; `/docs` unauthenticated but not data-mutative.
- **Logging:** structured logger with levels + request-id propagation (`request-id` middleware) — never log secrets.
- **Vulnerability:** recommend `govulncheck` / `npm audit` (not yet in CI) and env-based secret rotation.

Security claims must accurately reflect implementation (do not claim bcrypt/JWT/refresh-token rotation — DevScout uses Supabase sessions). Link to `docs/security.md`.

## 21. Documentation Map

Provide a concise table — README acts as index, docs holds depth.

| Document | Purpose | Source of truth |
|---|---|---|
| `architecture.md` | System architecture, proxy rationale, folder structure, deployment (Vite + Hono + Vercel) | `src/router/*`, `server/src/app.ts`, `vercel.json`, `vite.config.ts` |
| `api.md` | API reference (`/api/github/*`, `/api/score/*`, `/health`, `/openapi.json`) | `server/src/routes/*`, `server/src/app.ts: openapi` |
| `database.md` | Tables, constraints, RLS policies, triggers, migration history | `src/supabase/migrations.sql` |
| `er.md` | ER diagram + relationships | `src/supabase/migrations.sql` |
| `frontend.md` | Vue/Pinia/Router/composables/components guide | `src/*` |
| `security.md` | Auth, RLS, secrets, rate limiting, CORS | `src/services/supabase.ts`, `server/.env`, `server/src/middleware/*` |
| `stack-versions.md` | Full dependency inventory + versions | `package.json`, `server/package.json` |
| `deployment.md` | Vercel deployment, Supabase setup, PAT rotation | `vercel.json`, `api/index.ts`, `.env.example` |
| `testing.md` | Unit + E2E + typecheck strategy | `vitest.config.ts`, `playwright.config.ts` |
| `ROADMAP.md` | Future work (governance, eslint, CI, govulncheck) | — |

The README should not duplicate `docs/`; it should deep-link with one line per doc.

## 22. License

State:

`Proprietary — internal project.`

If this is intended as an open-source portfolio project, reconsider before publication (add MIT/Apache-2.0 + clarify Supabase/GitHub key handling).

## 23. Content Rules (apply to final README.md)

The README must:

- Use concise technical language; prefer concrete file references (`server/src/routes/github.ts:14`) over vague claims.
- Prefer implementation evidence (cache TTLs, queue limits, scoring weights) sourced from code.
- Avoid unsupported performance claims (no "blazing fast" without Playwright/Vitest benchmarks).
- Avoid exaggerated production claims (DevScout is not a distributed inventory system — don't borrow Inventra language).
- Avoid repeating the same explanation across sections — explain once, cross-link.
- Link to `src/supabase/migrations.sql` and `server/src/*` instead of duplicating SQL/policy listings.
- Keep code examples minimal: one demo quick-start block + one Supabase block + one env block + one test block.
- Keep diagrams readable in monospaced text (test in GitHub markdown preview).
- Use consistent terminology: DevScout, shortlist/collections/saved searches, candidate score, skill breakdown, RLS (not RBAC).
- Maintain strong references on every claim: every architectural decision must cite the source file/folder.

## 24. Content to Remove From Main README (Inventra residue)

Move or delete before publication:

- Exact Go/Gin/GORM/pgx/bcrypt/Viper/Zap/inventory-ledger line references — none exist in DevScout.
- `FOR UPDATE` / row-level locking / version checks / append-only ledger / reservations / cycle counts / `IdempotencyKey` — replace with RLS + queue/cache narrative.
- Complete environment-variable tables for Go/JWT/bcrypt — replace with `.env.example` + `server/.env`.
- `Make` target tables (`make build`, `make migrate-up`) — DevScout uses `npm run *` on root + `server/`.
- ADMIN/STAFF permission matrix — replace with per-user RLS ownership table.
- Detailed `docs/inventory-*` implementation walkthroughs — use DevScout `docs/architecture|database|api`.
- Any screenshot referencing "inventory management" or warehouse UI — replace with DevScout dashboard/search/profile.

The goal is not to hide depth — it's to put each level in the correct document and keep the README inventory-free.

## 25. README Length Target

Target:

**250–350 lines**

Acceptable:

**200–400 lines**

Avoid:

**450+ lines**

Current `README.md` is ~206 lines (under target, good starting point). After adding architecture diagram + folder structure + stack table + API table, expect 300–350 lines. A README exceeding 400 lines should be trimmed by moving detail to `docs/` (e.g., full migration SQL).

## 26. Success Criteria

The README is considered successful when:

### Recruiter test (60s)

A recruiter can identify:

- What DevScout is (GitHub sourcing + collections/notes/compare/score).
- Main stack (Vue 3 + Supabase + GitHub API).
- Why it matters (treats GitHub as source, adds recruiter workflow).
- Where to see it (demo mode, two screenshots).

### Engineer test (3 min)

An engineer can identify:

- Architecture (Vite SPA :4000 → Hono :4001 → GitHub API + Supabase) + Vercel collapse.
- Data model (7 tables + RLS) and why per-user isolation is the security model.
- GitHub handling (queue/cache/PAT/rate-limit headers).
- Scoring/skill-breakdown algorithms (weights, Promise.allSettled).
- Auth model (Supabase + demo mock) and router guard.
- How to start locally (both demo and Supabase + PAT paths).

### Developer test

A developer can start the app without consulting another doc for basic setup:

```bash
npm install
npm run dev   # demo mode works immediately
# OR with persistence:
# fill .env (from .env.example), paste src/supabase/migrations.sql, then npm run dev (SPA) + cd server && npm run dev (Hono)
```

### Documentation test

Every paragraph that promises depth links to a file or planned doc: `server/src/app.ts`, `src/supabase/migrations.sql`, `src/services/githubService.ts`, `docs/architecture.md`, etc. No orphan claims.

## 27. Priority

### P0 (README fails without)

- Header (correct title/pitch, no Inventra)
- Screenshots (or explicit placeholder)
- Tech stack (from package.json evidence)
- System Architecture (diagram + folder structure with paths)
- Engineering highlights (proxy/queue/cache/score/breakdown with references)
- Data integrity (Zod + RLS + FK table)
- Getting started (demo + Supabase, actual commands)
- Security (RLS + PAT server-only + validation)
- Documentation links

### P1 (expected for engineer audience)

- Data model (ER diagram, migration link)
- API overview (table with paths + source refs)
- Roles & permissions (RLS ownership, not RBAC matrix)
- Testing (unit/E2E/typecheck commands)
- Configuration (env vars from .env.example + server/.env)

### P2 (polish)

- Available scripts (npm table)
- Additional screenshots lower in doc
- Extended implementation notes (scoring thresholds, retry policy)
- `docs/stack-versions.md` + `docs/deployment.md` destinations

## 28. Final README Positioning

The README should position DevScout as:

> **A production-minded GitHub sourcing tool demonstrating Vue 3 SPA engineering, Supabase auth + Row Level Security, Hono-based GitHub API integration with rate-limit safety and caching, candidate scoring/skill-breakdown analytics, and recruiter-centric workflow (search → shortlist → collections → notes → compare).**

It must have strong references from architecture, system design, database, folder structures, and startup commands — every claim anchored to a path in the repo. It is not there to maximize buzzwords; it is there to prove the technologies present solve the sourcing workflow with real constraints (60→5000 req/hr, RLS isolation, 20-repo fan-out).

