import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isMock } from '../services/supabase'
import type { User } from '@supabase/supabase-js'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

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
    logger.info('AUTH', 'initialized', { user: data.user?.email ?? null })

    supabase.auth.onAuthStateChange((event, session) => {
      logger.info('AUTH', 'state changed', { event, user: session?.user?.email ?? null })
      user.value = session?.user ?? null
    })
  }

  async function login(email: string, password: string) {
    logger.info('AUTH', 'login', { email })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      logger.error('AUTH', 'login failed', error, { email })
      throw error
    }
    logger.info('AUTH', 'login OK', { email })
  }

  async function signup(email: string, password: string) {
    logger.info('AUTH', 'signup', { email })
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      logger.error('AUTH', 'signup failed', error, { email })
      throw error
    }
    logger.info('AUTH', 'signup OK — confirmation may be required', { email })
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
    toast().info('Signed out')
  }

  return { user, loading, initialize, login, signup, loginWithGithub, logout }
})
