import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSavedSearchesStore } from '../../src/stores/savedSearches'

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

describe('savedSearchesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should initialize with empty items', () => {
    const store = useSavedSearchesStore()
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('should fetch searches and populate items', async () => {
    const mockData = [{ id: '1', user_id: 'u1', query: 'vue developers', filters: { language: 'Vue' }, created_at: '2024-01-01' }]
    const supabase = await import('../../src/services/supabase')
    const chain = makeChain()
    chain.order = vi.fn().mockResolvedValue({ data: mockData, error: null })
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useSavedSearchesStore()
    await store.fetch()
    expect(store.items).toHaveLength(1)
    expect(store.items[0].query).toBe('vue developers')
  })

  it('should add a search', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = makeChain()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useSavedSearchesStore()
    await store.add('react developers', { language: 'React' })
    expect(chain.insert).toHaveBeenCalled()
  })

  it('should remove a search', async () => {
    const store = useSavedSearchesStore()
    await store.remove('1')
    // Should not throw when supabase delete/eq succeeds
    expect(store.items).toEqual([])
  })
})
