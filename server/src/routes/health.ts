import { Hono } from 'hono'
import { getRateLimit } from '../services/github.js'

const health = new Hono()

health.get('/', (c) => {
  const rl = getRateLimit()
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    github: {
      rateLimitRemaining: rl.remaining,
      rateLimit: rl.limit,
    },
  })
})

export { health }
