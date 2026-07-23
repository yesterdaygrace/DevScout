import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { proxyFetch } from '../services/github.js'

const github = new Hono()

const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
})

github.get('/search/users', zValidator('query', searchSchema), async (c) => {
  const { q, page, per_page } = c.req.valid('query')
  const res = await proxyFetch('/search/users', { q, page: String(page), per_page: String(per_page) })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

github.get('/users/:username', async (c) => {
  const { username } = c.req.param()
  const res = await proxyFetch(`/users/${username}`)
  return new Response(res.body, { status: res.status, headers: res.headers })
})

github.get('/users/:username/repos', async (c) => {
  const { username } = c.req.param()
  const res = await proxyFetch(`/users/${username}/repos`, { per_page: '50', sort: 'updated' })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

// Proxy individual repo languages (used by getSkillBreakdown)
github.get('/repos/:owner/:repo/languages', async (c) => {
  const { owner, repo } = c.req.param()
  const res = await proxyFetch(`/repos/${owner}/${repo}/languages`)
  return new Response(res.body, { status: res.status, headers: res.headers })
})

// Search issues/PRs (used by getUserPRs)
const searchIssuesSchema = z.object({
  q: z.string().min(1),
  per_page: z.coerce.number().int().min(1).max(100).default(1),
})
github.get('/search/issues', zValidator('query', searchIssuesSchema), async (c) => {
  const { q, per_page } = c.req.valid('query')
  const res = await proxyFetch('/search/issues', { q, per_page: String(per_page) })
  return new Response(res.body, { status: res.status, headers: res.headers })
})

github.get('/users/:username/languages', async (c) => {
  const { username } = c.req.param()
  const res = await proxyFetch(`/users/${username}/repos`, { per_page: '20', sort: 'updated' })
  const repos = await res.json() as any[]
  const langMap: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.fork) continue
    const langRes = await proxyFetch(`/repos/${repo.full_name}/languages`)
    const langs = await langRes.json() as Record<string, number>
    for (const [lang, bytes] of Object.entries(langs)) {
      langMap[lang] = (langMap[lang] || 0) + bytes
    }
  }
  const total = Object.values(langMap).reduce((s, v) => s + v, 0)
  const breakdown = Object.entries(langMap)
    .map(([language, bytes]) => ({ language, bytes, percentage: total > 0 ? Math.round((bytes / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.percentage - a.percentage)
  return c.json(breakdown)
})

export { github }
