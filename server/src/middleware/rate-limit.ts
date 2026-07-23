import { createMiddleware } from 'hono/factory'

const windowMs = 60_000
const maxRequests = 60

const hitCounts = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = createMiddleware(async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
  const now = Date.now()
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
