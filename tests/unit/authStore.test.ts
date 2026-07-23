import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../src/stores/auth'

const { mockGetUser, mockSignIn, mockSignUp, mockSignOut, mockOnAuthStateChange } = vi.hoisted(() => ({
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  mockSignIn: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  mockSignUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
  mockOnAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
}))

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
  isMock: false,
}))

function fakeUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: overrides.id ?? 'user-1',
    email: overrides.email ?? 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as ReturnType<typeof fakeUser>
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('should initialize with no user', async () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.loading).toBe(true)
  })

  it('should initialize and set loading to false', async () => {
    const store = useAuthStore()
    await store.initialize()
    expect(store.loading).toBe(false)
    expect(store.user).toBeNull()
  })

  it('should load user on initialize when session exists', async () => {
    const fake = fakeUser({ id: 'u1', email: 'u1@test.com' })
    mockGetUser.mockResolvedValueOnce({ data: { user: fake }, error: null })

    const store = useAuthStore()
    await store.initialize()
    expect(store.user).toBeDefined()
    expect(store.user?.id).toBe('u1')
  })

  it('should register onAuthStateChange listener', async () => {
    const store = useAuthStore()
    await store.initialize()
    expect(mockOnAuthStateChange).toHaveBeenCalled()
  })

  it('should throw on login error', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid login' } })

    const store = useAuthStore()
    await expect(store.login('bad@test.com', 'wrong')).rejects.toEqual({ message: 'Invalid login' })
  })

  it('should succeed on valid login', async () => {
    mockSignIn.mockResolvedValueOnce({ data: { user: fakeUser() }, error: null })

    const store = useAuthStore()
    await store.login('ok@test.com', 'pass')
    expect(mockSignIn).toHaveBeenCalledWith({ email: 'ok@test.com', password: 'pass' })
  })

  it('should throw on signup error', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Email already registered' } })

    const store = useAuthStore()
    await expect(store.signup('dup@test.com', 'pass')).rejects.toEqual({ message: 'Email already registered' })
  })

  it('should succeed on signup', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: fakeUser() }, error: null })

    const store = useAuthStore()
    await store.signup('new@test.com', 'pass')
    expect(mockSignUp).toHaveBeenCalledWith({ email: 'new@test.com', password: 'pass' })
  })

  it('should call signOut on logout', async () => {
    const store = useAuthStore()
    await store.logout()
    expect(mockSignOut).toHaveBeenCalled()
  })
})
