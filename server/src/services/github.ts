import { Cache } from '../lib/cache.js'

const GITHUB_API = 'https://api.github.com'
const CACHE_TTL = 30 * 60 * 1000

interface RateLimit {
  remaining: number
  limit: number
  reset: number
}

let rateLimit: RateLimit = { remaining: 60, limit: 60, reset: 0 }

const cache = new Cache<any>(CACHE_TTL, 200)

function getPat(): string | null {
  return process.env.GITHUB_PAT || null
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'talent-dir-api/1.0',
  }
  const pat = getPat()
  if (pat) headers.Authorization = `token ${pat}`
  return headers
}

function extractRateLimit(headers: Headers) {
  const remaining = headers.get('x-ratelimit-remaining')
  const limit = headers.get('x-ratelimit-limit')
  const reset = headers.get('x-ratelimit-reset')
  if (remaining && limit && reset) {
    rateLimit = {
      remaining: Number(remaining),
      limit: Number(limit),
      reset: Number(reset) * 1000,
    }
  }
}

export async function proxyFetch(path: string, params?: Record<string, string>): Promise<Response> {
  const cacheKey = `${path}:${JSON.stringify(params || {})}`
  const cached = cache.get(cacheKey)
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'content-type': 'application/json', 'x-cache': 'HIT' },
    })
  }

  const url = new URL(`${GITHUB_API}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), { headers: buildHeaders() })
  extractRateLimit(res.headers)

  if (!res.ok) {
    const text = await res.text()
    return new Response(text, { status: res.status, statusText: res.statusText })
  }

  const data = await res.json()
  cache.set(cacheKey, data)

  const body = JSON.stringify(data)
  const headers = new Headers({
    'content-type': 'application/json',
    'x-cache': 'MISS',
    'x-ratelimit-remaining': String(rateLimit.remaining),
    'x-ratelimit-limit': String(rateLimit.limit),
  })

  return new Response(body, { headers })
}

export function getRateLimit(): RateLimit {
  return { ...rateLimit }
}
