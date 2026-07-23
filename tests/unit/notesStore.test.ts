import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '../../src/stores/notes'

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      data: [],
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isMock: false,
}))

describe('notesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should initialize with empty notes', () => {
    const store = useNotesStore()
    expect(store.notes).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('should return undefined for non-existent username', () => {
    const store = useNotesStore()
    expect(store.getNote('torvalds')).toBeUndefined()
  })
})
