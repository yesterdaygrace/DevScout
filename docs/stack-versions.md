# Stack Versions

> Pinned versions from `package.json` + `server/package.json`. Run `npm list` / `pnpm list` to verify.

## Frontend (root — `package.json`)

| Package | Version | Purpose |
|---|---|---|
| vue | ^3.5.34 | Composition API + script setup |
| vue-router | ^4.6.4 | Routing |
| pinia | ^3.0.4 | State |
| vite | ^8.0.12 | Build/dev + proxy (`vite.config.ts:5`) |
| @vitejs/plugin-vue | ^6.0.6 | Vue SFC |
| @tailwindcss/vite | ^4.3.1 | Tailwind 4 |
| tailwindcss | ^4.3.1 | Styling |
| typescript | ~6.0.2 | Types |
| vue-tsc | ^3.2.8 | Typecheck (`vue-tsc -b`) |
| @vue/tsconfig | ^0.9.1 | TS config |
| chart.js | ^4.5.1 | Charts |
| vue-chartjs | ^5.3.3 | Vue wrapper |
| axios | ^1.17.0 | HTTP (via `/api/github`, `axios.create`) |
| @supabase/supabase-js | ^2.108.1 | Auth/DB (`src/services/supabase.ts`) |
| @heroicons/vue | ^2.2.0 | Icons |
| @vueuse/core | ^14.3.0 | Composables |
| marked | ^18.0.7 | Markdown (`MarkdownEditor.vue`) |
| zod | ^3.24.0 | Validation (shared with server) |
| hono | ^4.7.0 | Also in root for Vercel adapter (`api/index.ts`) |
| @hono/node-server | ^1.13.0 | Vercel handle |
| @hono/zod-validator | ^0.4.0 | Validation (mirrors server) |
| @hono/swagger-ui | ^0.5.0 | Docs |
| @types/node | ^24.12.3 | Node types |

> Note: root also pins `react ^18.3.1` + `react-dom ^18.3.1` + `@types/react` + `agentation ^3.0.2` for tooling/preview, not app runtime.

## Backend (server/)

| Package | Version | Purpose |
|---|---|---|
| hono | ^4.7.0 | API proxy |
| @hono/node-server | ^1.13.0 | Node adapter |
| @hono/zod-validator | ^0.4.0 | Validation |
| @hono/swagger-ui | ^0.5.0 | OpenAPI docs |
| zod | ^3.24.0 | Schemas |
| tsx | ^4.19.0 | Watch + --env-file |
| typescript | ~5.7.0 | Build |

## Quality

| Tool | Version | Config |
|---|---|---|
| vitest | ^4.1.8 | `vitest.config.ts` jsdom |
| @vue/test-utils | ^2.4.11 | Unit mount |
| jsdom | ^29.1.1 | DOM |
| @playwright/test | ^1.60.0 | `playwright.config.ts` |
