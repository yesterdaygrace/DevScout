import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShortlistStore } from '../../src/stores/shortlist'

function makeChain() {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
  return chain
}

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(() => makeChain()),
  },
  isMock: false,
}))

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'u1', email: 'test@test.com' },
  }),
}))

describe('shortlistStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should initialize with empty shortlist', () => {
    const store = useShortlistStore()
    expect(store.items).toEqual([])
  })

  it('should add an item', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = makeChain()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useShortlistStore()
    await store.add('torvalds')
    expect(chain.insert).toHaveBeenCalled()
  })

  it('should check if username is shortlisted', () => {
    const store = useShortlistStore()
    store.items = [{ id: '1', user_id: 'u1', github_username: 'torvalds', created_at: '2024-01-01' }]
    expect(store.isShortlisted('torvalds')).toBe(true)
    expect(store.isShortlisted('gaearon')).toBe(false)
  })

  it('should remove an item', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = makeChain()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useShortlistStore()
    await store.remove('torvalds')
    // Should not throw
  })
})
