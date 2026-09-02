# Frontend

> Sources: `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/stores/*`, `src/composables/*`, `src/components/*`, `src/pages/*`, `vite.config.ts`.

## Stack

Vue 3.5 (`<script setup>` + Composition API) + Vite 8 + TypeScript 6 + Pinia 3 + Vue Router 4 + Tailwind 4.3 + VueUse 14 + Chart.js 4.5 + Axios 1.17.

## Boot

`src/main.ts` → `createApp(App.vue)` + `createPinia()` + `router` → `App.vue` layouts. `vite.config.ts` dev server `:4000` proxies `/api` → `:4001`.

## Routing

`src/router/index.ts`: 11 routes + `beforeEach` guard (`supabase.auth.getUser()` → `requiresAuth` → `/login`). Meta titles per route. `DefaultLayout.vue` shell (nav + `CommandPalette.vue`) wraps `/`, `/search`, `/profile/:username`, `/compare`, `/searches`, `/collections`, `/notes-search`, `/settings/*`.

## State

Pinia stores (`src/stores/`):

- `auth` — `supabase.auth` + demo `mock.ts` fallback
- `shortlist` — `supabase.from('shortlist')` CRUD, `isShortlisted()`, toasts
- `collections` / `collection_members` — group pipelines
- `savedSearches` — `query` + `filters JSONB`
- `notes` — `github_username` + `content` + `tags[]`, `updated_at`
- `recentlyViewed` — `viewed_at` append
- `compare` — 2–3 users in-memory
- `ui` / `toast` — global state

All stores require `auth.user.id` before writes; demo mode skips.

## Composables

- `useCandidateScore` — 6 factors weighted (0.20/0.20/0.20/0.15/0.15/0.10) → 0–100 + rank
- `useSkillBreakdown` — aggregates `/languages` bytes
- `useGitHubApi` / `githubService.ts` — queue (`10/50`) + cache (30m/100) + rate-limit
- `useDebounce`, `useSearchHistory`, `useRateLimit` (`isLow` <20), `useDashboardStats`, `useErrorHandler`, `useOfflineDetection`, `useToast`

## Components

- **Layout:** `DefaultLayout.vue`, `CommandPalette.vue`
- **Feedback:** `ErrorBoundary.vue`, `GlobalErrorHandler.vue`, `ToastContainer.vue`, `OfflineBanner.vue`, `SkeletonCard.vue`, `LoadingSkeleton.vue`
- **Domain:** `CandidateScoreCard.vue`, `MarkdownEditor.vue` (marked), `Candidate` lists
- **Dashboard:** `KPIGrid.vue`, `ApiUsageWidget.vue`, `RecentlyViewed.vue`, `RecentlyCompared.vue`, `RecentCollections.vue`, `InsightsPanel.vue`, `LanguageDistribution.vue`, `SearchAnalytics.vue`, `ActivityFeed.vue`, `GlobalSearchBar.vue`, `GreetingSection.vue`

## Types & Utils

`src/types/github.ts` (`GitHubUser`, `GitHubRepo`, `SkillBreakdown`), `domain.ts` (`Note`, `SavedSearch…`), `utils/cache`, `retry`, `export` (CSV), `debug` (logger).

## Build

`npm run typecheck` (`vue-tsc -b --noEmit`) → `npm run build` (`vue-tsc -b && vite build` → `dist/`) → `npm run preview`.
