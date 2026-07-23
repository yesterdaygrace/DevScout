import axios from 'axios'
import type { GitHubSearchResult, GitHubUser, GitHubRepo, GitHubRepoLanguage } from '../types/github'
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

export function isUsingPAT(): boolean {
  return false // PAT is handled server-side via GITHUB_PAT
}

export async function searchUsers(query: string, page = 1): Promise<GitHubSearchResult> {
  const cacheKey = `search:${query}:${page}`
  const cached = getCached<GitHubSearchResult>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'searchUsers', { query, page })
  const { data } = await queuedRequest(() =>
    githubApi.get<GitHubSearchResult>('/search/users', {
      params: { q: query, per_page: 20, page },
    })
  )
  setCache(cacheKey, data)
  logger.info('GITHUB', 'searchUsers result', { total: data.total_count, returned: data.items.length })
  return data
}

export async function getUser(username: string): Promise<GitHubUser> {
  const cacheKey = `user:${username}`
  const cached = getCached<GitHubUser>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'getUser', { username })
  const { data } = await queuedRequest(() =>
    githubApi.get<GitHubUser>(`/users/${username}`)
  )
  setCache(cacheKey, data)
  return data
}

export async function getUserRepos(username: string): Promise<GitHubRepo[]> {
  const cacheKey = `repos:${username}`
  const cached = getCached<GitHubRepo[]>(cacheKey)
  if (cached) return cached

  logger.info('GITHUB', 'getUserRepos', { username })
  const { data } = await queuedRequest(() =>
    githubApi.get<GitHubRepo[]>(`/users/${username}/repos`, {
      params: { per_page: 50, sort: 'updated' },
    })
  )
  setCache(cacheKey, data)
  return data
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
