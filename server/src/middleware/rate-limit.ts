import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { getConnInfo } from '@hono/node-server/conninfo'

const windowMs = 60_000
const maxRequests = 60
const MAX_RATE_LIMIT_ENTRIES = 5_000

interface RateLimitEntry {
  count: number
  resetAt: number
}

const hitCounts = new Map<string, RateLimitEntry>()

/**
 * Periodically purge expired entries and ensure map never exceeds MAX_RATE_LIMIT_ENTRIES
 */
function pruneExpiredEntries(now: number) {
  for (const [key, entry] of hitCounts.entries()) {
    if (now > entry.resetAt) {
      hitCounts.delete(key)
    }
  }

  // If still above capacity (e.g. distributed flood), evict oldest entries
  if (hitCounts.size >= MAX_RATE_LIMIT_ENTRIES) {
    const overflow = hitCounts.size - MAX_RATE_LIMIT_ENTRIES + 500
    let evicted = 0
    for (const key of hitCounts.keys()) {
      hitCounts.delete(key)
      evicted++
      if (evicted >= overflow) break
    }
  }
}

/**
 * Extract the client IP. Forwarded headers are client-controlled unless a trusted ingress sets
 * them, so they are honoured only when running on Vercel or with TRUST_PROXY=true. Otherwise the
 * socket address is used.
 */
function getClientIp(c: Context): string {
  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.VERCEL === '1'
  if (trustProxy) {
    const vercelIp = c.req.header('x-vercel-forwarded-for')
    if (vercelIp) {
      const firstIp = vercelIp.split(',')[0]?.trim()
      if (firstIp && firstIp.length <= 45) return firstIp
    }

    const realIp = c.req.header('x-real-ip')
    if (realIp && realIp.trim().length <= 45) return realIp.trim()

    const xff = c.req.header('x-forwarded-for')
    if (xff) {
      // Trusted proxy appends the client IP: take the rightmost entry
      const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
      const targetIp = parts[parts.length - 1]
      if (targetIp && targetIp.length <= 45) return targetIp
    }
  }

  try {
    const address = getConnInfo(c).remote.address
    if (address) return address
  } catch {
    // No socket info available (e.g. in-process test request)
  }
  return 'local-client'
}

export const rateLimit = createMiddleware(async (c, next) => {
  const now = Date.now()
  const ip = getClientIp(c)

  // Periodic cleanup trigger (every 100 requests or on table overflow)
  if (hitCounts.size >= MAX_RATE_LIMIT_ENTRIES || Math.random() < 0.01) {
    pruneExpiredEntries(now)
  }

  const entry = hitCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    hitCounts.set(ip, { count: 1, resetAt: now + windowMs })
    c.res.headers.set('x-ratelimit-remaining', String(maxRequests - 1))
    c.res.headers.set('x-ratelimit-limit', String(maxRequests))
    await next()
    return
  }

  entry.count++
  const remaining = Math.max(0, maxRequests - entry.count)
  c.res.headers.set('x-ratelimit-remaining', String(remaining))
  c.res.headers.set('x-ratelimit-limit', String(maxRequests))

  if (entry.count > maxRequests) {
    c.res.headers.set('retry-after', String(Math.ceil((entry.resetAt - now) / 1000)))
    c.status(429)
    return c.json({ error: 'Too many requests. Try again later.' })
  }

  await next()
})
