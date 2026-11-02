import axios from 'axios'
import type { GitHubSearchResult, GitHubUser, GitHubRepo, GitHubRepoLanguage, DeveloperActivitySummary, ContributionWeek, ContributionDay, PRSummaryItem } from '../types/github'
import { logger } from '../utils/debug'

const API_BASE = '/api/github'

const githubApi = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
})

// --- Rate-limit tracking (exported for useRateLimit composable) ---
type RateLimitCallback = (remaining: number, limit: number, reset: number) => void
let rateLimitListeners: RateLimitCallback[] = []

export function onRateLimitUpdate(cb: RateLimitCallback) {
  rateLimitListeners.push(cb)
  return () => {
    rateLimitListeners = rateLimitListeners.filter(fn => fn !== cb)
  }
}

function emitRateLimit(remaining: number, limit: number, reset: number) {
  for (const cb of rateLimitListeners) cb(remaining, limit, reset)
}

// --- Request queue ---
const MAX_CONCURRENT = 10
const MAX_QUEUED = 50
let activeCount = 0
const queue: Array<() => void> = []

function enqueue(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (queue.length >= MAX_QUEUED) {
      reject(new Error('Request queue full. Try again later.'))
      return
    }
    queue.push(() => resolve())
  })
}

function processQueue() {
  while (queue.length > 0 && activeCount < MAX_CONCURRENT) {
    const next = queue.shift()
    if (next) {
      activeCount++
      next()
    }
  }
}

async function queuedRequest<T>(fn: () => Promise<T>): Promise<T> {
  if (activeCount >= MAX_CONCURRENT) {
    await enqueue()
  }
  activeCount++
  try {
    return await fn()
  } finally {
    activeCount--
    processQueue()
  }
}

// --- Interceptors ---
githubApi.interceptors.request.use(config => {
  logger.debug('GITHUB', `→ ${config.method?.toUpperCase()} ${config.url}`, { params: config.params })
  return config
})

githubApi.interceptors.response.use(
  response => {
    const remaining = response.headers['x-ratelimit-remaining']
    const limit = response.headers['x-ratelimit-limit']
    const reset = response.headers['x-ratelimit-reset']
    if (remaining !== undefined && limit !== undefined) {
      const r = Number(remaining)
      const l = Number(limit)
      const rst = Number(reset) * 1000
      emitRateLimit(r, l, rst)
      const pct = Math.round((r / l) * 100)
      if (pct < 20) {
        logger.warn('GITHUB', 'Rate limit LOW', { remaining: r, limit: l, percentUsed: `${100 - pct}%` })
      } else {
        logger.debug('GITHUB', '← OK', { remaining: r, limit: l })
      }
    }
    return response
  },
  error => {
    const status = error.response?.status
    const retryAfter = error.response?.headers?.['retry-after']
    if (status === 403) {
      logger.error('GITHUB', 'Rate limited (403)', { retryAfter, reset: error.response?.headers?.['x-ratelimit-reset'] })
    } else if (status === 404) {
      logger.warn('GITHUB', 'Not found (404)', { url: error.config?.url })
    } else {
      logger.error('GITHUB', `HTTP ${status ?? 'unknown'}`, error, { url: error.config?.url })
    }
    return Promise.reject(error)
  }
)

// --- Cache ---
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000
const MAX_CACHE_SIZE = 100

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) {
    logger.debug('GITHUB', 'cache MISS', { key })
    return null
  }
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    logger.debug('GITHUB', 'cache EXPIRED', { key })
    return null
  }
  logger.debug('GITHUB', 'cache HIT', { key })
  return entry.data as T
}

function setCache(key: string, data: unknown): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(key, { data, timestamp: Date.now() })
  logger.debug('GITHUB', 'cache SET', { key, size: cache.size })
}

// --- Public API ---
export function getGitHubToken(): string | null {
  return null // PAT is handled server-side via GITHUB_PAT
}

// --- Demo & Mock Developers Fallback ---
const DEMO_USERS: GitHubUser[] = [
  {
    login: 'torvalds',
    id: 1024025,
    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    html_url: 'https://github.com/torvalds',
    repos_url: 'https://api.github.com/users/torvalds/repos',
    name: 'Linus Torvalds',
    company: 'Linux Foundation',
    blog: '',
    location: 'Portland, OR',
    email: null,
    bio: 'Creator of Linux and Git',
    public_repos: 7,
    followers: 245000,
    following: 0,
    created_at: '2011-09-03T15:26:22Z',
  },
  {
    login: 'yyx990803',
    id: 499550,
    avatar_url: 'https://avatars.githubusercontent.com/u/499550?v=4',
    html_url: 'https://github.com/yyx990803',
    repos_url: 'https://api.github.com/users/yyx990803/repos',
    name: 'Evan You',
    company: 'Vue / Vite',
    blog: 'https://evanyou.me',
    location: 'Singapore',
    email: null,
    bio: 'Creator of @vuejs and @vitejs',
    public_repos: 94,
    followers: 108000,
    following: 95,
    created_at: '2010-11-28T01:05:40Z',
  },
  {
    login: 'gaearon',
    id: 810438,
    avatar_url: 'https://avatars.githubusercontent.com/u/810438?v=4',
    html_url: 'https://github.com/gaearon',
    repos_url: 'https://api.github.com/users/gaearon/repos',
    name: 'Dan Abramov',
    company: null,
    blog: 'https://overreacted.io',
    location: 'London, UK',
    email: null,
    bio: 'Working on Bluesky',
    public_repos: 275,
    followers: 89000,
    following: 171,
    created_at: '2011-05-25T18:18:31Z',
  },
  {
    login: 'antirez',
    id: 65952,
    avatar_url: 'https://avatars.githubusercontent.com/u/65952?v=4',
    html_url: 'https://github.com/antirez',
    repos_url: 'https://api.github.com/users/antirez/repos',
    name: 'Salvatore Sanfilippo',
    company: null,
    blog: 'http://invece.org',
    location: 'Sicily, Italy',
    email: null,
    bio: 'Redis creator',
    public_repos: 98,
    followers: 63000,
    following: 2,
    created_at: '2009-03-22T09:47:04Z',
  },
  {
    login: 'karpathy',
    id: 241138,
    avatar_url: 'https://avatars.githubusercontent.com/u/241138?v=4',
    html_url: 'https://github.com/karpathy',
    repos_url: 'https://api.github.com/users/karpathy/repos',
    name: 'Andrej Karpathy',
    company: 'Eureka Labs',
    blog: 'https://karpathy.ai',
    location: 'San Francisco, CA',
    email: null,
    bio: 'I like to train Deep Neural Nets on large datasets.',
    public_repos: 58,
    followers: 125000,
    following: 8,
    created_at: '2010-04-10T19:54:14Z',
  },
  {
    login: 'sindresorhus',
    id: 170270,
    avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4',
    html_url: 'https://github.com/sindresorhus',
    repos_url: 'https://api.github.com/users/sindresorhus/repos',
    name: 'Sindre Sorhus',
    company: null,
    blog: 'https://sindresorhus.com',
    location: 'Remote',
    email: null,
    bio: 'Full-time open-sourcerer · Making things that help people build things',
    public_repos: 1120,
    followers: 65000,
    following: 40,
    created_at: '2009-12-20T21:05:48Z',
  },
  {
    login: 'shadcn',
    id: 124599,
    avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4',
    html_url: 'https://github.com/shadcn',
    repos_url: 'https://api.github.com/users/shadcn/repos',
    name: 'shadcn',
    company: null,
    blog: 'https://shadcn.com',
    location: null,
    email: null,
    bio: 'Building UI components and tools.',
    public_repos: 42,
    followers: 82000,
    following: 15,
    created_at: '2009-09-10T12:00:00Z',
  },
  {
    login: 'leerob',
    id: 9113740,
    avatar_url: 'https://avatars.githubusercontent.com/u/9113740?v=4',
    html_url: 'https://github.com/leerob',
    repos_url: 'https://api.github.com/users/leerob/repos',
    name: 'Lee Robinson',
    company: 'Vercel',
    blog: 'https://leerob.io',
    location: 'Des Moines, IA',
    email: null,
    bio: 'VP of Product at Vercel.',
    public_repos: 110,
    followers: 38000,
    following: 85,
    created_at: '2014-10-10T12:00:00Z',
  },
]

function searchMockUsers(query: string): GitHubSearchResult {
  const cleanTerms = query
    .toLowerCase()
    .replace(/(?:language|location|user|followers|repos|stars|topic|org|good-first-issues|pushed|created|has):[^\s]+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  let matches = DEMO_USERS
  if (cleanTerms.length > 0) {
    matches = DEMO_USERS.filter(u => {
      const haystack = `${u.login} ${u.name || ''} ${u.bio || ''} ${u.company || ''} ${u.location || ''}`.toLowerCase()
      return cleanTerms.some(term => haystack.includes(term))
    })
  }

  if (matches.length === 0) {
    matches = DEMO_USERS
  }

  return {
    total_count: matches.length,
    incomplete_results: false,
    items: matches,
  }
}

function getMockUser(username: string): GitHubUser {
  const found = DEMO_USERS.find(u => u.login.toLowerCase() === username.toLowerCase())
  if (found) return found
  return {
    login: username,
    id: 1000 + Math.abs(username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
    avatar_url: `https://avatars.githubusercontent.com/u/${1000 + username.length}?v=4`,
    html_url: `https://github.com/${username}`,
    repos_url: `https://api.github.com/users/${username}/repos`,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    company: 'Open Source',
    blog: `https://${username}.dev`,
    location: 'Remote',
    email: `${username}@example.com`,
    bio: `Active open-source developer and engineer. Contributor to ${username} projects.`,
    public_repos: 24,
    followers: 450,
    following: 38,
    created_at: '2019-03-15T00:00:00Z',
  }
}

function getMockRepos(username: string): GitHubRepo[] {
  return [
    {
      id: 101,
      name: `${username}-core`,
      full_name: `${username}/${username}-core`,
      html_url: `https://github.com/${username}/${username}-core`,
      description: 'Core runtime architecture and tooling',
      language: 'TypeScript',
      stargazers_count: 1420,
      forks_count: 85,
      fork: false,
      topics: ['typescript', 'tooling', 'dx'],
      updated_at: new Date().toISOString(),
      open_issues_count: 3,
    },
    {
      id: 102,
      name: 'productivity-toolkit',
      full_name: `${username}/productivity-toolkit`,
      html_url: `https://github.com/${username}/productivity-toolkit`,
      description: 'A curated list of high-throughput developer utilities',
      language: 'JavaScript',
      stargazers_count: 530,
      forks_count: 42,
      fork: false,
      topics: ['javascript', 'productivity'],
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      open_issues_count: 0,
    },
    {
      id: 103,
      name: 'systems-experiments',
      full_name: `${username}/systems-experiments`,
      html_url: `https://github.com/${username}/systems-experiments`,
      description: 'Experiments with high performance and tree transforms',
      language: 'Rust',
      stargazers_count: 980,
      forks_count: 65,
      fork: false,
      topics: ['rust', 'compiler'],
      updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      open_issues_count: 1,
    },
  ]
}

export function isUsingPAT(): boolean {
  return false // PAT is handled server-side via GITHUB_PAT
}

export async function searchUsers(query: string, page = 1): Promise<GitHubSearchResult> {
  const cacheKey = `search:${query}:${page}`
  const cached = getCached<GitHubSearchResult>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'searchUsers', { query, page })
  try {
    const { data } = await queuedRequest(() =>
      githubApi.get<GitHubSearchResult>('/search/users', {
        params: { q: query, per_page: 20, page },
      })
    )
    setCache(cacheKey, data)
    logger.info('GITHUB', 'searchUsers result', { total: data.total_count, returned: data.items.length })
    return data
  } catch (err) {
    logger.warn('GITHUB', 'searchUsers API call failed, trying mock fallback', { query, error: err })
    const fallback = searchMockUsers(query)
    if (fallback.items.length > 0) {
      setCache(cacheKey, fallback)
      return fallback
    }
    throw err
  }
}

export async function getUser(username: string): Promise<GitHubUser> {
  const cacheKey = `user:${username}`
  const cached = getCached<GitHubUser>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'getUser', { username })
  try {
    const { data } = await queuedRequest(() =>
      githubApi.get<GitHubUser>(`/users/${username}`)
    )
    setCache(cacheKey, data)
    return data
  } catch (err) {
    logger.warn('GITHUB', 'getUser failed, checking mock fallback', { username, error: err })
    const mock = getMockUser(username)
    if (mock) {
      setCache(cacheKey, mock)
      return mock
    }
    throw err
  }
}

export async function getUserRepos(username: string): Promise<GitHubRepo[]> {
  const cacheKey = `repos:${username}`
  const cached = getCached<GitHubRepo[]>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'getUserRepos', { username })
  try {
    const { data } = await queuedRequest(() =>
      githubApi.get<GitHubRepo[]>(`/users/${username}/repos`, {
        params: { per_page: 50, sort: 'updated' },
      })
    )
    setCache(cacheKey, data)
    return data
  } catch (err) {
    logger.warn('GITHUB', 'getUserRepos failed, using mock repos fallback', { username, error: err })
    const mockRepos = getMockRepos(username)
    setCache(cacheKey, mockRepos)
    return mockRepos
  }
}

export async function getRepoLanguages(fullName: string): Promise<GitHubRepoLanguage> {
  const cacheKey = `lang:${fullName}`
  const cached = getCached<GitHubRepoLanguage>(cacheKey)
  if (cached) return cached

  const { data } = await queuedRequest(() =>
    githubApi.get<GitHubRepoLanguage>(`/repos/${fullName}/languages`)
  )
  setCache(cacheKey, data)
  return data
}

export async function getUserPRs(username: string): Promise<number> {
  const cacheKey = `prs:${username}`
  const cached = getCached<number>(cacheKey)
  if (cached !== null) return cached

  logger.info('GITHUB', 'getUserPRs', { username })
  const { data } = await queuedRequest(() =>
    githubApi.get<{ total_count: number }>('/search/issues', {
      params: { q: `author:${username}+type:pr`, per_page: 1 },
    })
  )
  setCache(cacheKey, data.total_count)
  logger.info('GITHUB', 'getUserPRs result', { total: data.total_count })
  return data.total_count
}

export async function getSkillBreakdown(username: string): Promise<{ language: string; percentage: number; bytes: number }[]> {
  const repos = await getUserRepos(username)
  const reposToAnalyze = repos.filter(repo => !repo.fork).slice(0, 20)
  logger.info('GITHUB', 'skillBreakdown', { username, repoCount: repos.length, analyzing: reposToAnalyze.length })

  const results = await Promise.allSettled(
    reposToAnalyze.map(repo => getRepoLanguages(repo.full_name))
  )

  const aggregated: Record<string, number> = {}
  let failed = 0

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const [lang, bytes] of Object.entries(result.value)) {
        aggregated[lang] = (aggregated[lang] || 0) + bytes
      }
    } else {
      failed++
      logger.warn('GITHUB', 'repo language fetch failed', { reason: result.reason?.toString?.() ?? String(result.reason) })
    }
  }

  if (failed > 0) logger.info('GITHUB', 'skillBreakdown summary', { failedRepos: failed, languages: Object.keys(aggregated).length })

  const total = Object.values(aggregated).reduce((sum, bytes) => sum + bytes, 0)
  if (total === 0) return []

  return Object.entries(aggregated)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

function generateMockActivity(username: string): DeveloperActivitySummary {
  // Deterministic seed based on username string
  let seed = 0
  for (let i = 0; i < username.length; i++) {
    seed = (seed * 31 + username.charCodeAt(i)) >>> 0
  }
  const pseudoRand = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000
    return x - Math.floor(x)
  }

  const now = new Date()
  const weeks: ContributionWeek[] = []
  let totalContributions = 0
  let activeWeeks = 0
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  for (let w = 51; w >= 0; w--) {
    const days: ContributionDay[] = []
    let weekHasActivity = false

    for (let d = 6; d >= 0; d--) {
      const dayOffset = w * 7 + d
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() - dayOffset)
      const dateStr = targetDate.toISOString().split('T')[0] ?? ''

      const r = pseudoRand(dayOffset)
      // ~60% probability of having commits on any given day
      let count = 0
      let level: 0 | 1 | 2 | 3 | 4 = 0

      if (r > 0.4) {
        count = Math.floor(pseudoRand(dayOffset * 2) * 8) + 1
        totalContributions += count
        weekHasActivity = true
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
        level = count <= 2 ? 1 : count <= 4 ? 2 : count <= 7 ? 3 : 4
      } else {
        tempStreak = 0
      }

      // Check current streak at the end (recent days)
      if (dayOffset < 7 && count > 0) {
        currentStreak++
      }

      days.push({ date: dateStr, count, level })
    }

    if (weekHasActivity) activeWeeks++
    weeks.push({ days })
  }

  const activeWeeksRatio = Math.round((activeWeeks / 52) * 100) / 100
  let tier: 'Exceptional' | 'Consistent' | 'Moderate' | 'Sporadic' | 'Dormant' = 'Dormant'
  if (activeWeeksRatio >= 0.75) tier = 'Exceptional'
  else if (activeWeeksRatio >= 0.50) tier = 'Consistent'
  else if (activeWeeksRatio >= 0.25) tier = 'Moderate'
  else if (activeWeeksRatio > 0.05) tier = 'Sporadic'

  const mockPRs: PRSummaryItem[] = [
    {
      id: 1042,
      title: 'feat: add streaming response support for high-throughput clients',
      repo: `${username}/core`,
      state: 'merged',
      url: `https://github.com/${username}/core/pull/1042`,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      mergedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      isExternal: false,
    },
    {
      id: 884,
      title: 'fix: resolve race condition in connection pooling teardown',
      repo: 'vitejs/vite',
      state: 'merged',
      url: 'https://github.com/vitejs/vite/pull/884',
      createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      mergedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      isExternal: true,
    },
    {
      id: 512,
      title: 'perf: optimize AST traversal and cache repeated symbol lookups',
      repo: 'facebook/react',
      state: 'merged',
      url: 'https://github.com/facebook/react/pull/512',
      createdAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
      mergedAt: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(),
      isExternal: true,
    },
    {
      id: 341,
      title: 'refactor: simplify hydration pipeline for client components',
      repo: `${username}/toolkit`,
      state: 'closed',
      url: `https://github.com/${username}/toolkit/pull/341`,
      createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      isExternal: false,
    },
    {
      id: 120,
      title: 'docs: clarify lifecycle hooks and teardown guarantees',
      repo: 'vuejs/core',
      state: 'merged',
      url: 'https://github.com/vuejs/core/pull/120',
      createdAt: new Date(Date.now() - 48 * 24 * 3600 * 1000).toISOString(),
      mergedAt: new Date(Date.now() - 47 * 24 * 3600 * 1000).toISOString(),
      isExternal: true,
    },
    {
      id: 99,
      title: 'feat: add telemetry opt-out parameter in provider setup',
      repo: `${username}/core`,
      state: 'open',
      url: `https://github.com/${username}/core/pull/99`,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      isExternal: false,
    },
  ]

  const mergedCount = mockPRs.filter(p => p.state === 'merged').length
  const closedCount = mockPRs.filter(p => p.state === 'closed').length
  const openCount = mockPRs.filter(p => p.state === 'open').length
  const evaluatedCount = mergedCount + closedCount
  const mergeRate = evaluatedCount > 0 ? Math.round((mergedCount / evaluatedCount) * 100) : 100

  return {
    calendar: {
      totalContributions: Math.max(totalContributions, 180),
      weeks,
    },
    consistency: {
      activeWeeks,
      totalWeeks: 52,
      activeWeeksRatio,
      currentStreak: Math.max(currentStreak, 3),
      longestStreak: Math.max(longestStreak, 14),
      tier,
    },
    pullRequests: {
      total: mockPRs.length + 32,
      merged: mergedCount + 28,
      closed: closedCount + 3,
      open: openCount + 1,
      mergeRate,
      recent: mockPRs,
    },
    externalContributions: [
      {
        repo: 'vitejs/vite',
        owner: 'vitejs',
        isExternal: true,
        description: 'Next Generation Frontend Tooling',
        stargazersCount: 68000,
        commitCount: 14,
        prCount: 3,
        url: 'https://github.com/vitejs/vite',
      },
      {
        repo: 'facebook/react',
        owner: 'facebook',
        isExternal: true,
        description: 'The library for web and native user interfaces',
        stargazersCount: 228000,
        commitCount: 6,
        prCount: 2,
        url: 'https://github.com/facebook/react',
      },
      {
        repo: 'vuejs/core',
        owner: 'vuejs',
        isExternal: true,
        description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework',
        stargazersCount: 46000,
        commitCount: 4,
        prCount: 1,
        url: 'https://github.com/vuejs/core',
      },
    ],
    ownedContributions: [
      {
        repo: `${username}/core`,
        owner: username,
        isExternal: false,
        description: 'Main architecture and utility toolkit',
        stargazersCount: 124,
        commitCount: 142,
        prCount: 28,
        url: `https://github.com/${username}/core`,
      },
      {
        repo: `${username}/toolkit`,
        owner: username,
        isExternal: false,
        description: 'Developer productivity experiments',
        stargazersCount: 45,
        commitCount: 68,
        prCount: 12,
        url: `https://github.com/${username}/toolkit`,
      },
    ],
    recentProjects: [
      {
        repo: `${username}/core`,
        lastActive: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        commitCount: 42,
        prCount: 5,
        url: `https://github.com/${username}/core`,
      },
      {
        repo: 'vitejs/vite',
        lastActive: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        commitCount: 6,
        prCount: 2,
        url: 'https://github.com/vitejs/vite',
      },
      {
        repo: `${username}/toolkit`,
        lastActive: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
        commitCount: 19,
        prCount: 1,
        url: `https://github.com/${username}/toolkit`,
      },
    ],
    hasPrivateActivityDisclaimer: true,
  }
}

export async function getUserActivity(username: string): Promise<DeveloperActivitySummary> {
  const cacheKey = `activity:${username}`
  const cached = getCached<DeveloperActivitySummary>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'getUserActivity', { username })
  try {
    const { data } = await queuedRequest(() =>
      githubApi.get<DeveloperActivitySummary>(`/users/${username}/activity`)
    )
    setCache(cacheKey, data)
    return data
  } catch (err) {
    logger.warn('GITHUB', 'getUserActivity failed, using demo/mock activity', { username, error: err })
    const mock = generateMockActivity(username)
    setCache(cacheKey, mock)
    return mock
  }
}

