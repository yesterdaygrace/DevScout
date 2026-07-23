import { Hono } from 'hono'
import { proxyFetch } from '../services/github.js'
import { calculateScore } from '../services/score.js'

const score = new Hono()

score.get('/:username', async (c) => {
  const { username } = c.req.param()

  const [userRes, reposRes] = await Promise.all([
    proxyFetch(`/users/${username}`),
    proxyFetch(`/users/${username}/repos`, { per_page: '50', sort: 'updated' }),
  ])

  if (!userRes.ok) {
    return c.json({ error: 'User not found' }, 404)
  }

  const user = await userRes.json() as any
  const repos = await reposRes.json() as any[]

  const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0)
  const languages = new Set<string>()
  for (const repo of repos) {
    if (repo.language) languages.add(repo.language)
  }

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentActivity = repos.some((r: any) => new Date(r.updated_at) >= threeMonthsAgo)
  const accountAgeDays = user.created_at
    ? (Date.now() - new Date(user.created_at).getTime()) / 86400000
    : 0

  const result = calculateScore({
    publicRepos: user.public_repos || 0,
    followers: user.followers || 0,
    totalStars,
    languages: languages.size,
    recentActivity,
    accountAgeDays: Math.round(accountAgeDays),
    hasWebsite: !!user.blog,
    hasBio: !!user.bio,
  })

  return c.json({
    username,
    avatar_url: user.avatar_url,
    name: user.name,
    ...result,
  })
})

export { score }
