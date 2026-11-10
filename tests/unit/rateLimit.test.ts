import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'

async function buildApp() {
  vi.resetModules()
  const { rateLimit } = await import('../../server/src/middleware/rate-limit')
  const app = new Hono()
  app.use('/api/*', rateLimit)
  app.get('/api/x', (c) => c.text('ok'))
  return app
}

async function statuses(app: Hono, header: string, rotate: boolean, n = 70) {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const res = await app.request('/api/x', { headers: { [header]: rotate ? `10.0.${i}.1` : '10.0.0.1' } })
    out.push(res.status)
  }
  return out
}

describe('rate limiter client identity', () => {
  beforeEach(() => {
    vi.stubEnv('VERCEL', '')
    vi.stubEnv('TRUST_PROXY', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it.each(['x-real-ip', 'x-vercel-forwarded-for', 'x-forwarded-for'])(
    'ignores client-supplied %s when no trusted proxy is configured',
    async (header) => {
      const app = await buildApp()
      const codes = await statuses(app, header, true)
      expect(codes.filter((c) => c === 429).length).toBe(10)
    }
  )

  it('honours forwarded headers when TRUST_PROXY=true', async () => {
    vi.stubEnv('TRUST_PROXY', 'true')
    const app = await buildApp()
    const codes = await statuses(app, 'x-real-ip', true)
    expect(codes.every((c) => c === 200)).toBe(true)
  })

  it('still limits a single client behind a trusted proxy', async () => {
    vi.stubEnv('TRUST_PROXY', 'true')
    const app = await buildApp()
    const codes = await statuses(app, 'x-real-ip', false)
    expect(codes.filter((c) => c === 429).length).toBe(10)
  })
})
