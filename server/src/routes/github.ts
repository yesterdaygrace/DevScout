import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { proxyFetch } from '../services/github.js'
import { getDeveloperActivity } from '../services/activity.js'

const github = new Hono()

const usernameParamSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, 'Invalid GitHub username').max(39),
})

const repoParamSchema = z.object({
  owner: z.string().regex(/^[a-zA-Z0-9._-]+$/, 'Invalid owner parameter').max(100, 'Owner parameter too long'),
  repo: z.string().regex(/^[a-zA-Z0-9._-]+$/, 'Invalid repo parameter').max(100, 'Repo parameter too long'),
})

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required').max(256, 'Query exceeds maximum length of 256 characters'),
  page: z.coerce.number().int().min(1).max(100).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

github.get('/search/users', zValidator('query', searchSchema), async (c) => {
  const { q, page, per_page } = c.req.valid('query')
  const res = await proxyFetch('/search/users', { q, page: String(page), per_page: String(per_page) })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

github.get('/users/:username', zValidator('param', usernameParamSchema), async (c) => {
  const { username } = c.req.valid('param')
  const res = await proxyFetch(`/users/${username}`)
  return new Response(res.body, { status: res.status, headers: res.headers })
})

github.get('/users/:username/repos', zValidator('param', usernameParamSchema), async (c) => {
  const { username } = c.req.valid('param')
  const res = await proxyFetch(`/users/${username}/repos`, { per_page: '50', sort: 'updated' })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

// Proxy individual repo languages (used by getSkillBreakdown)
github.get('/repos/:owner/:repo/languages', zValidator('param', repoParamSchema), async (c) => {
  const { owner, repo } = c.req.valid('param')
  const res = await proxyFetch(`/repos/${owner}/${repo}/languages`)
  return new Response(res.body, { status: res.status, headers: res.headers })
})

// Search issues/PRs (used by getUserPRs)
const searchIssuesSchema = z.object({
  q: z.string().min(1, 'Query is required').max(256, 'Query exceeds maximum length of 256 characters'),
  per_page: z.coerce.number().int().min(1).max(100).default(1),
})
github.get('/search/issues', zValidator('query', searchIssuesSchema), async (c) => {
  const { q, per_page } = c.req.valid('query')
  const res = await proxyFetch('/search/issues', { q, per_page: String(per_page) })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

// Aggregate languages with concurrency and error protection
github.get('/users/:username/languages', zValidator('param', usernameParamSchema), async (c) => {
  const { username } = c.req.valid('param')
  const res = await proxyFetch(`/users/${username}/repos`, { per_page: '10', sort: 'updated' })
  if (!res.ok) {
    return c.json({ error: 'Failed to fetch repositories' }, res.status as any)
  }

  const reposData = await res.json()
  if (!Array.isArray(reposData)) {
    return c.json({ error: 'Invalid repository data received' }, 502)
  }

  const nonForkRepos = reposData.filter(r => !r.fork).slice(0, 10)
  const langMap: Record<string, number> = {}

  // Fetch languages in parallel with error isolation
  await Promise.all(
    nonForkRepos.map(async (repo) => {
      try {
        const langRes = await proxyFetch(`/repos/${repo.full_name}/languages`)
        if (langRes.ok) {
          const langs = (await langRes.json()) as Record<string, number>
          for (const [lang, bytes] of Object.entries(langs)) {
            langMap[lang] = (langMap[lang] || 0) + bytes
          }
        }
      } catch {
        // Individual repo failure does not crash the response
      }
    })
  )

  const total = Object.values(langMap).reduce((s, v) => s + v, 0)
  const breakdown = Object.entries(langMap)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  return c.json(breakdown)
})

// Comprehensive activity endpoint (commit calendar, PR analytics, repository contributions)
github.get('/users/:username/activity', zValidator('param', usernameParamSchema), async (c) => {
  const { username } = c.req.valid('param')
  try {
    const activity = await getDeveloperActivity(username)
    return c.json(activity)
  } catch (err: any) {
    const reqId = c.get('requestId') || 'unknown'
    console.error(`[ACTIVITY ERROR] [${reqId}]`, err)
    return c.json({ error: 'Failed to fetch developer activity', requestId: reqId }, 500)
  }
})

export { github }
