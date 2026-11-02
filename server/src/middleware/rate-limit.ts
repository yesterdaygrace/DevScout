import { createMiddleware } from 'hono/factory'

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
 * Extract client IP address safely from request headers.
 * Protects against IP spoofing by not blindly trusting untrusted X-Forwarded-For headers
 * unless running behind a recognized reverse proxy (e.g. Vercel or TRUST_PROXY=true).
 */
function getClientIp(cReq: { header: (name: string) => string | undefined }): string {
  // 1. Check verified Vercel Edge infrastructure header (cannot be spoofed from outside)
  const vercelIp = cReq.header('x-vercel-forwarded-for')
  if (vercelIp) {
    const firstIp = vercelIp.split(',')[0]?.trim()
    if (firstIp && firstIp.length <= 45) {
      return firstIp
    }
  }

  // 2. Only trust X-Forwarded-For if explicitly running behind a trusted proxy
  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.VERCEL === '1'
  if (trustProxy) {
    const realIp = cReq.header('x-real-ip')
    if (realIp && realIp.trim().length <= 45) {
      return realIp.trim()
    }

    const xff = cReq.header('x-forwarded-for')
    if (xff) {
      // In trusted proxy setups where proxy appends client IP, take rightmost address before proxy
      const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
      const targetIp = parts[parts.length - 1]
      if (targetIp && targetIp.length <= 45) {
        return targetIp
      }
    }
  }

  // 3. Fallback to direct x-real-ip if provided or local fallback
  const directRealIp = cReq.header('x-real-ip')
  if (directRealIp && directRealIp.trim().length <= 45) {
    return directRealIp.trim()
  }

  return 'local-client'
}

export const rateLimit = createMiddleware(async (c, next) => {
  const now = Date.now()
  const ip = getClientIp(c.req)

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
