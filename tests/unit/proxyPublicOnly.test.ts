import { describe, it, expect, vi, afterEach } from 'vitest'
import app from '../../server/src/app'

describe('GitHub proxy search/issues', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('restricts upstream search to public data', async () => {
    const fetchStub = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ total_count: 0, items: [] }), { status: 200, headers: { 'content-type': 'application/json' } })
    )
    vi.stubGlobal('fetch', fetchStub)

    const res = await app.request('/api/github/search/issues?q=repo:acme/secret%20is:issue&per_page=1')
    expect(res.status).toBe(200)

    const upstream = new URL(String(fetchStub.mock.calls[0][0]))
    expect(upstream.origin).toBe('https://api.github.com')
    expect(upstream.searchParams.get('q')).toBe('repo:acme/secret is:issue is:public')
  })
})
