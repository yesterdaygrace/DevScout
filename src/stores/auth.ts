import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isMock } from '../services/supabase'
import type { User } from '@supabase/supabase-js'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

function maskEmail(email?: string | null): string {
  if (!email) return ''
  const [name, domain] = email.split('@')
  if (!domain) return '***'
  const visible = name && name.length > 0 ? name[0] : ''
  return `${visible}***@${domain}`
}

// Browser-side per-user caches that must not survive into the next account on a shared browser
const USER_SCOPED_STORAGE_KEYS = [
  'search_history', 'recently_compared', 'dashboard_activity', 'saved_searches_favorites',
  'saved_searches_usage', 'notes_pinned', 'collection_styles',
]

function clearUserScopedStorage() {
  try {
    for (const key of USER_SCOPED_STORAGE_KEYS) localStorage.removeItem(key)
  } catch {
    // Storage unavailable; nothing to clear
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  function toast() { return useToastStore() }

  async function initialize() {
    logger.info('AUTH', 'initialize', { isMock })

    if (isMock) {
      logger.info('AUTH', 'Mock mode — auto-login demo user')
      await supabase.auth.signInWithPassword({ email: 'demo@dev.local', password: 'demo' })
    }

    const { data, error } = await supabase.auth.getUser()
    if (error) logger.error('AUTH', 'getUser failed', error)
    user.value = data.user
    loading.value = false
    logger.info('AUTH', 'initialized', { user: maskEmail(data.user?.email) })

    supabase.auth.onAuthStateChange((event, session) => {
      logger.info('AUTH', 'state changed', { event, user: maskEmail(session?.user?.email) })
      user.value = session?.user ?? null
    })
  }

  async function login(email: string, password: string) {
    logger.info('AUTH', 'login', { email: maskEmail(email) })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      logger.error('AUTH', 'login failed', error, { email: maskEmail(email) })
      throw error
    }
    logger.info('AUTH', 'login OK', { email: maskEmail(email) })
  }

  async function signup(email: string, password: string) {
    logger.info('AUTH', 'signup', { email: maskEmail(email) })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      logger.error('AUTH', 'signup failed', error, { email: maskEmail(email) })
      throw error
    }
    logger.info('AUTH', 'signup OK — confirmation may be required', { email: maskEmail(email) })
  }

  async function loginWithGithub() {
    logger.info('AUTH', 'loginWithGithub')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    })
    if (error) {
      logger.error('AUTH', 'GitHub login failed', error)
      throw error
    }
  }

  async function logout() {
    logger.info('AUTH', 'logout')
    await supabase.auth.signOut()
    clearUserScopedStorage()
    toast().info('Signed out')
  }

  return { user, loading, initialize, login, signup, loginWithGithub, logout }
})
