# Security

> Sources: `src/services/supabase.ts`, `src/router/index.ts`, `src/supabase/migrations.sql`, `server/.env`, `server/src/middleware/*`, `server/src/services/github.ts`.

## Auth

- **Supabase Auth** — email/password + GitHub OAuth (PKCE via Supabase). Session via `@supabase/supabase-js`.
- **Guard:** `src/router/index.ts:38 beforeEach` checks `supabase.auth.getUser()`; `requiresAuth` → `/login`, authenticated → `/`.
- **Trigger:** `handle_new_user()` auto-creates `profiles` on `auth.users` insert.
- **Demo mode:** `src/services/mock.ts` + `src/stores/auth.ts` demo branch — bypasses Supabase entirely, isolated.

## Authorization (RLS)

`ENABLE ROW LEVEL SECURITY` on 7 tables. Policies (15+) enforce `auth.uid()=user_id` (or parent `EXISTS` for `collection_members`). Even with leaked client key, server rejects cross-user writes. See `docs/database.md` + `src/supabase/migrations.sql:65-210`.

| Capability | Enforced by |
|---|---|
| Search/profile/score/breakdown | No DB write; Hono validation only |
| Shortlist/notes/saved_searches/collections | `auth.uid()=user_id` |
| Collection members | `EXISTS (SELECT 1 FROM collections WHERE id=collection_id AND user_id=auth.uid())` |

## Secrets

- **GitHub PAT:** `GITHUB_PAT` in `server/.env` only (`server/src/services/github.ts:9 getPat()` → `Authorization: token <pat>` + `User-Agent`, `Cache` 30m/200). Client `VITE_GITHUB_PERSONAL_ACCESS_TOKEN` deprecated (`src/services/githubService.ts:138 getGitHubToken() → null`, `isUsingPAT() → false`). Never commit PAT; rotate via Vercel env.
- **Supabase anon key:** `VITE_SUPABASE_ANON_KEY` is public by design but RLS still applies; `service_role` key must never be client-exposed.
- **OAuth:** `VITE_GITHUB_CLIENT_ID/SECRET` → Supabase Auth Providers; callback `https://<project>.supabase.co/auth/v1/callback` (no trailing slash).

## Validation & Hardening

- **Zod** on every Hono query/path (`server/src/routes/github.ts:8 searchSchema`, `:30 searchIssuesSchema`); `per_page` 1–100; `page` ≥1; `q` min 1.
- **CORS:** `hono/cors` allowlist `['http://localhost:4000', 'http://localhost:4173']` (`server/src/app.ts:19`) — tighten to deployed domain in prod.
- **Rate limiting:** `server/src/middleware/rate-limit.ts:3` 60 req/60s per IP (`hitCounts Map`, `429 + retry-after`) on `/api/*` + client queue `MAX_CONCURRENT=10, MAX_QUEUED=50` (`src/services/githubService.ts:30`) + `src/utils/retry.ts` backoff + server `Cache` 30m/200. Prevents 60/hr → 403 bursts.
- **Logging:** `server/src/middleware/logger.ts` + `src/utils/debug.ts` structured logger (`[SERVER]` prefix, `request-id`); never log `GITHUB_PAT` or tokens.
- **Vulnerability:** `npm audit` + `govulncheck` recommended; add to CI (`docs/testing.md`).

## Recommendations

- Add `Content-Security-Policy` + `Strict-Transport-Security` headers in `server/src/app.ts`.
- Enable Supabase email confirmations and rate limits per doc in `docs/deployment.md`.
