import type { User } from '@supabase/supabase-js'
import { generateDefaultMockDb, type MockRow } from '../utils/seedData'

const MOCK_STORAGE_KEY = 'devscout_mock_db'

function loadMockDb(): Record<string, MockRow[]> {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') return parsed
      }
    }
  } catch {}
  return generateDefaultMockDb()
}

export function saveMockDb() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockDb))
    }
  } catch {}
}

export function reloadMockDb(): Record<string, MockRow[]> {
  const loaded = loadMockDb()
  for (const k of Object.keys(mockDb)) {
    delete mockDb[k]
  }
  Object.assign(mockDb, loaded)
  return mockDb
}

export const mockDb: Record<string, MockRow[]> = loadMockDb()

let currentUser: User | null = null
let authListeners: Array<(event: string, session: { user: User } | null) => void> = []

function genId(): string {
  return crypto.randomUUID()
}

function getUserId(): string {
  return currentUser?.id || 'demo-user'
}

export const mockSupabase = {
  auth: {
    getUser: async () => {
      if (!currentUser) return { data: { user: null }, error: null }
      return { data: { user: currentUser }, error: null }
    },
    onAuthStateChange: (listener: (event: string, session: { user: User } | null) => void) => {
      authListeners.push(listener)
      return { data: { subscription: { unsubscribe: () => { authListeners = [] } } } }
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      const id = 'demo-user'
      const now = new Date().toISOString()
      const mockUser: User = {
        id,
        email: email || 'demo@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: now,
        updated_at: now,
      } as User
      currentUser = mockUser

      // Ensure a profile row exists (simulates Supabase trigger)
      if (!mockDb.profiles.find(p => p.id === id)) {
        mockDb.profiles.push({
          id,
          user_id: id,
          email: mockUser.email,
          display_name: mockUser.email?.split('@')[0] || 'demo',
          created_at: now,
        })
      }

      authListeners.forEach(fn => fn('SIGNED_IN', { user: mockUser }))
      return { data: { user: mockUser }, error: null }
    },
    signUp: async ({ email }: { email: string }) => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const displayName = (email || 'demo@example.com').split('@')[0]
      const mockUser: User = {
        id,
        email: email || 'demo@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: { display_name: displayName },
        created_at: now,
        updated_at: now,
      } as User
      currentUser = mockUser

      // Insert profile row (simulates Supabase trigger)
      mockDb.profiles.push({
        id,
        user_id: id,
        email: mockUser.email,
        display_name: displayName,
        created_at: now,
      })

      authListeners.forEach(fn => fn('SIGNED_IN', { user: mockUser }))
      return { data: { user: mockUser, session: null }, error: null }
    },
    signOut: async () => {
      currentUser = null
      authListeners.forEach(fn => fn('SIGNED_OUT', null))
      return { error: null }
    },
  },
  from: (table: string) => ({
    select: () => {
      const allRows = () => (mockDb[table as keyof typeof mockDb] || [])
        .filter(r => r.user_id === getUserId())
      return {
        eq: () => ({
          order: () => ({
            limit: () => ({ data: allRows(), error: null }),
            data: allRows(),
          }),
          data: allRows(),
        }),
        in: (col: string, values: unknown[]) => ({
          order: () => ({
            data: allRows().filter(r => values.includes(r[col])),
            error: null,
          }),
          data: allRows().filter(r => values.includes(r[col])),
        }),
        data: allRows(),
      }
    },
    insert: (row: Record<string, unknown> | Array<Record<string, unknown>>) => {
      const rows = Array.isArray(row) ? row : [row]
      const arr = mockDb[table as keyof typeof mockDb] || []
      for (const r of rows) {
        arr.unshift({ id: genId(), user_id: getUserId(), ...r })
      }
      mockDb[table as keyof typeof mockDb] = arr
      saveMockDb()
      return { error: null }
    },
    update: (updates: Record<string, unknown>) => {
      const conditions: Array<[string, unknown]> = []
      const self = {
        eq: (col: string, val: unknown) => {
          conditions.push([col, val])
          return self
        },
        then: (resolve: (v: { error: null }) => void) => {
          const arr = mockDb[table]
          if (arr && conditions.length > 0) {
            const idx = arr.findIndex(r =>
              conditions.every(([c, v]) => r[c] === v) && r.user_id === getUserId()
            )
            if (idx !== -1) {
              Object.assign(arr[idx], updates)
              saveMockDb()
            }
          }
          resolve({ error: null })
        },
      }
      return self
    },
    delete: () => {
      const conditions: Array<[string, unknown]> = []
      const self = {
        eq: (col: string, val: unknown) => {
          conditions.push([col, val])
          return self
        },
        then: (resolve: (v: { error: null }) => void) => {
          const arr = mockDb[table]
          if (arr && conditions.length > 0) {
            const idx = arr.findIndex(r =>
              conditions.every(([c, v]) => r[c] === v) && r.user_id === getUserId()
            )
            if (idx !== -1) {
              arr.splice(idx, 1)
              saveMockDb()
            }
          }
          resolve({ error: null })
        },
      }
      return self
    },
  }),
  rpc: () => Promise.resolve({ data: null, error: null }),
}
