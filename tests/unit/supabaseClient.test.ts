import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn(() => ({})) }))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

describe('supabase client configuration', () => {
  beforeEach(() => {
    vi.resetModules()
    createClient.mockClear()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('uses PKCE and does not auto-consume session tokens from the URL', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon')
    await import('../../src/services/db')
    expect(createClient).toHaveBeenCalledWith('https://abc.supabase.co', 'anon', {
      auth: { flowType: 'pkce', detectSessionInUrl: false },
    })
  })

  it('refuses to start a production build in demo mode unless explicitly allowed', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.stubEnv('PROD', true)
    await expect(import('../../src/services/db')).rejects.toThrow(/Refusing to start in demo mode/)

    vi.resetModules()
    vi.stubEnv('VITE_ALLOW_MOCK', 'true')
    await expect(import('../../src/services/db')).resolves.toBeDefined()
  })
})
