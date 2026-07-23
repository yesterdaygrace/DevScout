# DevScout

A Vue 3 app for searching, shortlisting, and comparing GitHub developers. Built with Supabase auth, GitHub API, and Tailwind CSS.

## Why I Built This

Recruiters and engineering managers spend hours switching between GitHub, LinkedIn, spreadsheets, and personal notes while evaluating software engineers. This scattered workflow makes it hard to:

- Keep track of promising candidates across multiple searches
- Compare technical profiles side-by-side
- Remember why someone caught your attention weeks ago
- Organize candidates into meaningful groups for different roles

**DevScout** consolidates this workflow into one place. It connects directly to GitHub's API to pull real developer data—repository activity, language expertise, contribution patterns—then adds the organizational layer recruiters actually need: collections, private notes, comparison tools, and candidate scoring.

It's a production-ready Vue 3 app that solves a genuine sourcing pain point. It's not a LinkedIn clone—it's a lightweight research and organization tool that treats GitHub as the source of truth and adds the recruiter workflow on top.

## Screenshots

> Screenshots coming soon. Key areas to capture:
> - Dashboard with stats overview and shortlist
> - Search with advanced filters and results
> - Profile page with repository insights and candidate score
> - Saved searches and collections pages
> - Note editor with markdown preview

---

## Quick Start

```bash
npm install
npm run dev
```

The app runs in **demo mode** (mock auth) by default — no Supabase setup needed. You can log in with any email/password.

---

## Supabase Setup (for real auth & data persistence)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name**: `devscout` (or any name)
   - **Database Password**: Save this securely
   - **Region**: Choose the closest to you
4. Wait ~2 minutes for the project to provision

### 2. Copy API Credentials

1. In your Supabase project dashboard, go to **Settings → API**
2. Find these two values:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public key** → this is `VITE_SUPABASE_ANON_KEY`
3. Copy them into your `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run the Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Open a **New query**
3. Copy the entire contents of `src/supabase/migrations.sql`
4. Paste and click **Run**
5. Verify all 4 tables are created:
   - `profiles`
   - `shortlist`
   - `notes`
   - `recently_viewed`
6. Check that Row Level Security (RLS) policies are active (they should show in the **Authentication → Policies** page)

### 4. Enable GitHub OAuth

#### Configure GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `DevScout`
   - **Homepage URL**: `http://localhost:5173` (or your deployed URL)
   - **Authorization callback URL**: `https://<your-project>.supabase.co/auth/v1/callback`
     - Replace `<your-project>` with your Supabase project ID (from your `VITE_SUPABASE_URL`)
4. Click **Register application**
5. Copy the **Client ID** and **Client Secret** (click **Generate a new client secret**)

#### Configure Supabase GitHub Provider

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Find **GitHub** and toggle it **On**
3. Paste your **Client ID** and **Client Secret** from GitHub
4. Click **Save**

#### Add to .env

```env
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 5. Verify It Works

1. Run `npm run dev`
2. Open `http://localhost:5173/login`
3. You should see a **"Sign in with GitHub"** button below the email/password form
4. Click it → you'll be redirected to GitHub to authorize
5. After authorization, you'll be redirected back to the app
6. Your name and session should appear

> **Note**: If the GitHub OAuth flow doesn't complete locally, make sure the callback URL in your GitHub OAuth App settings exactly matches `https://<your-project>.supabase.co/auth/v1/callback` (no trailing slash).

---

## GitHub API Rate Limits

The GitHub API has strict rate limits:

| Auth Method | Requests/Hour | Setup Required |
|-------------|--------------|----------------|
| None (demo) | 60 | No |
| Personal Access Token | 5,000 | Yes (recommended) |

### Setting Up a Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **Generate new token → Generate new token (classic)**
3. Give it a name (e.g., "DevScout")
4. **No scopes are needed** for public repository access. Only check `public_repo` if you're building additional features that access private repos.
5. Click **Generate token**
6. Copy the token and add it to `.env`:

```env
VITE_GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

7. Restart the dev server (`npm run dev`)

> ⚠️ Without a token, you'll hit the 60 req/hour limit quickly during development — especially when loading skill breakdowns (which make one API call per repository).

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check + build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking only |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## Project Structure

```
src/
├── api/              # GitHub API client
├── assets/           # Static assets (images, icons)
├── composables/      # Vue composables (reusable stateful logic)
├── components/       # Vue components
├── layouts/          # Page layout wrappers
├── pages/            # Route pages
├── router/           # Vue Router configuration
├── services/         # Service layer (Supabase, GitHub)
├── stores/           # Pinia stores
├── supabase/         # Database migrations
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.vue           # Root component
├── main.ts           # App entry point
└── style.css         # Global styles (Tailwind CSS)
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vue 3** | UI framework (Composition API + `<script setup>`) |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Pinia** | State management |
| **Vue Router** | Routing |
| **Supabase** | Auth + Database (PostgreSQL) |
| **Tailwind CSS v4** | Styling |
| **Chart.js + vue-chartjs** | Skill breakdown charts |
| **Axios** | HTTP client (GitHub API) |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Heroicons** | SVG icons |
| **VueUse** | Utility composables |
