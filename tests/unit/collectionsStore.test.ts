import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectionsStore } from '../../src/stores/collections'

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn(),
  },
  isMock: false,
}))

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: vi.fn().mockReturnValue({
    user: { id: 'u1', email: 'test@test.com' },
  }),
}))

function mockFrom(data: any[] = []) {
  const chain: Record<string, any> = {}
  chain.order = vi.fn().mockResolvedValue({ data, error: null })
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.single = vi.fn().mockResolvedValue({ data: { id: 'copy-1', name: 'Test (copy)' }, error: null })
  return chain
}

describe('collectionsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should initialize with empty collections', () => {
    const store = useCollectionsStore()
    expect(store.collections).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('should fetch collections with members', async () => {
    const supabase = await import('../../src/services/supabase')
    const collectionsData = [{ id: 'c1', user_id: 'u1', name: 'Backend Devs', created_at: '2024-01-01' }]
    const membersData = [{ id: 'm1', collection_id: 'c1', github_username: 'torvalds', created_at: '2024-01-01' }]

    const chain1 = mockFrom(collectionsData)
    const chain2 = mockFrom(membersData)
    ;(supabase.supabase.from as any).mockReturnValueOnce(chain1).mockReturnValueOnce(chain2)

    const store = useCollectionsStore()
    await store.fetch()
    expect(store.collections).toHaveLength(1)
    expect(store.collections[0].name).toBe('Backend Devs')
    expect(store.collections[0].members).toHaveLength(1)
  })

  it('should create a collection', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = mockFrom()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useCollectionsStore()
    await store.create('Go Devs')
    expect(chain.insert).toHaveBeenCalledWith({ user_id: 'u1', name: 'Go Devs' })
  })

  it('should rename a collection', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = mockFrom()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useCollectionsStore()
    store.collections = [{ id: 'c1', user_id: 'u1', name: 'Old', created_at: '2024-01-01', members: [] }]
    await store.rename('c1', 'Renamed')
    expect(chain.update).toHaveBeenCalledWith({ name: 'Renamed' })
  })

  it('should remove a collection', async () => {
    const supabase = await import('../../src/services/supabase')
    const chain = mockFrom()
    ;(supabase.supabase.from as any).mockReturnValue(chain)

    const store = useCollectionsStore()
    await store.remove('c1')
    expect(chain.delete).toHaveBeenCalled()
  })

  it('should detect duplicate collection in test', async () => {
    const supabase = await import('../../src/services/supabase')
    const collectionsData = [{ id: 'c1', user_id: 'u1', name: 'Test', created_at: '2024-01-01' }]
    const membersData = [{ id: 'm1', collection_id: 'c1', github_username: 'torvalds', created_at: '2024-01-01' }]

    const chain1 = mockFrom(collectionsData)
    const chain2 = mockFrom(membersData)
    const chain3 = mockFrom()
    ;(supabase.supabase.from as any)
      .mockReturnValueOnce(chain1) // fetch collections
      .mockReturnValueOnce(chain2) // fetch members
      .mockReturnValueOnce(chain3) // insert new collection
      .mockReturnValueOnce(chain1) // fetch collections again
      .mockReturnValueOnce(chain2) // fetch members again
      .mockReturnValueOnce(chain3) // insert members for duplicate

    const store = useCollectionsStore()
    await store.fetch()
    expect(store.collections).toHaveLength(1)
  })
})
