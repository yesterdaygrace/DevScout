# API Reference

> Sources: `server/src/app.ts` (OpenAPI), `server/src/routes/github.ts`, `server/src/routes/score.ts`, `server/src/routes/health.ts`, `src/services/githubService.ts`.

**Base URL:** dev `http://localhost:4001` (Vite proxies `/api/*` from `:4000`); prod via `vercel.json` → `api/index.ts`. Docs: `GET /docs` (Swagger UI) + `GET /openapi.json`.

## Endpoints

| Method | Path | Auth | Purpose | File |
|---|---|---|---|---|
| GET | `/health` | none | Liveness | `server/src/routes/health.ts` |
| GET | `/api/github/search/users?q=&page=&per_page=` | none (PAT server) | Search GitHub users — `q` required, `page`/`per_page` Zod-validated | `server/src/routes/github.ts:14` |
| GET | `/api/github/users/:username` | none | Get profile | same |
| GET | `/api/github/users/:username/repos` | none | List repos (50, `sort=updated`) | same |
| GET | `/api/github/repos/:owner/:repo/languages` | none | Per-repo language bytes | same |
| GET | `/api/github/users/:username/languages` | none | Aggregated breakdown (`!fork` 20, sorted %) | same |
| GET | `/api/github/search/issues?q=&per_page=` | none | Search issues/PRs (e.g., `q=author:username+type:pr`) | same |
| GET | `/api/score/:username` | none | Candidate score (`proxyFetch` user+repos → `calculateScore`) | `server/src/routes/score.ts` |
| GET | `/openapi.json` | none | OpenAPI 3.0.3 JSON | `server/src/app.ts:31` |
| GET | `/docs` | none | Swagger UI | same |

**Validation:** `zValidator('query', searchSchema)` (`server/src/routes/github.ts:8`) — `q` min 1, `page`/`per_page` 1–100, coercion via Zod (`z.coerce.number().int()`). Errors return 400 with Zod details.

**GitHub proxy:** `server/src/services/github.ts:11-71` — `getPat()` → `process.env.GITHUB_PAT`, `buildHeaders()` → `Authorization: token <pat>` + `User-Agent: talent-dir-api/1.0`, `Cache` 30m/200 (`new Cache(CACHE_TTL, 200)`, `CACHE_TTL=30*60*1000`), `x-cache: HIT/MISS` + `x-ratelimit-*` forwarding.

## Client Usage

`src/services/githubService.ts` — `axios.create({baseURL: '/api/github'})` with queue/cache/rate-limit interceptors:

```ts
searchUsers(q, page) → GET /search/users?q=&page=&per_page=20
getUser(username) → GET /users/:username
getUserRepos(username) → GET /users/:username/repos
getRepoLanguages(fullName) → GET /repos/:owner/:repo/languages
getUserPRs(username) → GET /search/issues?q=author:username+type:pr
getSkillBreakdown(username) → local agg over getUserRepos + getRepoLanguages
```

Server-side `getSkillBreakdown` alternative: `GET /api/github/users/:username/languages` does the aggregation server-side (20 non-fork repos).

**Rate limiting:** Headers `x-ratelimit-remaining/limit/reset` forwarded to client; `useRateLimit` warns at <20%.

## OpenAPI Example

`GET /openapi.json` returns paths for `/health`, `/api/github/search/users`, `/api/github/users/{username}`, etc. — see `server/src/app.ts:31-44`.
