# Deployment

> Sources: `vercel.json`, `api/index.ts`, `server/src/app.ts`, `.env.example`, `server/.env`, `vite.config.ts`.

## Vercel (production)

- **Build:** `npm run build` (`vue-tsc -b && vite build`) → `dist/` (Vite) + `server/dist/` (`tsc`) if needed.
- **Rewrites** (`vercel.json`):
  ```json
  { "source": "/api/(.*)", "destination": "/api/index" },
  { "source": "/((?!api/).*)", "destination": "/index.html" }
  ```
  `api/index.ts` = `handle(app)` from `server/src/app.ts` via `@hono/node-server/vercel`.
- **Env:** Set `GITHUB_PAT` + `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + OAuth IDs in Vercel Project → Settings → Environment Variables.

## Local Development

```bash
# Terminal 1 — Hono :4001
cd server && npm install
echo "GITHUB_PAT=ghp_xxx" > .env
npm run dev          # tsx watch --env-file=.env src/index.ts
curl http://localhost:4001/health

# Terminal 2 — Vite :4000 (proxies /api → :4001 per vite.config.ts)
cd .. && npm install
npm run dev          # http://localhost:4000
```

Demo mode works with no Supabase env (see `README.md#configuration`).

## Supabase

1. Create project → Settings → API → copy `VITE_SUPABASE_URL` + `anon` → `.env`.
2. SQL Editor → paste `src/supabase/migrations.sql` → Run.
3. GitHub OAuth App (`github.com/settings/developers`) callback `https://<project>.supabase.co/auth/v1/callback` → Supabase Auth → Providers → GitHub → paste ID/Secret.

No Docker / `make` — Supabase manages Postgres.

## Secrets & Rotation

- `GITHUB_PAT` (server) — no scopes needed for public data; rotate at `github.com/settings/tokens` → update `server/.env` + Vercel.
- Rate without PAT = 60/hr; with PAT = 5000/hr. Skill breakdown (20× languages) needs PAT.

## ENV Contract

See `.env.example` + `server/.env` + `src/env.d.ts`. Missing Supabase vars → demo mock (`src/services/mock.ts`).
