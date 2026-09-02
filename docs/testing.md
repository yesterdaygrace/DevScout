# Testing

> Sources: `vitest.config.ts`, `playwright.config.ts`, `package.json`, `tests/unit/**`, `tests/e2e/**`.

## Unit (Vitest)

- **Env:** `vitest.config.ts` — `jsdom`, `include: ['tests/unit/**/*.test.ts']`, plugins `[vue()]`.
- **Tools:** `vitest`, `@vue/test-utils`, `jsdom`.
- **Run:** `npm run test:unit` (run), `npm run test:unit:watch` (watch).
- **Scope:** `useCandidateScore`, `useSkillBreakdown`, `src/utils/cache|retry|export`, Pinia stores (`shortlist`, `collections`…), composables (`useDebounce`, `useRateLimit`).
- **Typecheck gate:** `npm run typecheck` (`vue-tsc -b --noEmit`) blocks build.

## E2E (Playwright)

- **Config:** `playwright.config.ts` — `testDir ./tests/e2e`, `baseURL http://localhost:4000`, `webServer: npm run dev` on `:4000`, `chromium` only, `retries 2` on CI, `trace on-first-retry`, `screenshot only-on-failure`.
- **Run:** `npm run test:e2e`.
- **Coverage:** Login → search → profile → shortlist → notes → collections → compare → dashboard flows; demo mode avoids Supabase flakiness.

## Manual

- `npm run lint` → `vue-tsc --noEmit` (no ESLint configured — opportunity).
- `npm run build` → `vue-tsc -b && vite build` must pass before merge.

## Roadmap

- Add ESLint + `eslint-plugin-vue`, add `govulncheck` / `npm audit` to CI, add coverage thresholds (`c8`/`v8`), add GitHub Actions matrix.
