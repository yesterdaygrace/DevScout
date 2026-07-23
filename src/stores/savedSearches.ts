import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import type { SavedSearch } from '../types/domain'
import { useAuthStore } from './auth'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

export const useSavedSearchesStore = defineStore('savedSearches', () => {
  const items = ref<SavedSearch[]>([])
  const loading = ref(false)

  function toast() { return useToastStore() }

  async function fetch() {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SAVED_SEARCHES', 'fetch skipped — no user'); return }

    loading.value = true
    logger.info('SAVED_SEARCHES', 'fetch', { userId: auth.user.id })
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (error) logger.error('SAVED_SEARCHES', 'fetch failed', error)
    if (data) { items.value = data; logger.info('SAVED_SEARCHES', 'fetch OK', { count: data.length }) }
    loading.value = false
  }

  async function add(query: string, filters?: any) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SAVED_SEARCHES', 'add skipped — no user'); return }

    logger.info('SAVED_SEARCHES', 'add', { query })
    const { error } = await supabase
      .from('saved_searches')
      .insert({ user_id: auth.user.id, query, filters })
    if (error) {
      logger.error('SAVED_SEARCHES', 'add failed', error, { query })
      toast().error('Failed to save search')
      return
    }
    toast().success('Search saved')
    await fetch()
  }

  async function remove(id: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SAVED_SEARCHES', 'remove skipped — no user'); return }

    logger.info('SAVED_SEARCHES', 'remove', { id })
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('id', id)
    if (error) {
      logger.error('SAVED_SEARCHES', 'remove failed', error, { id })
      toast().error('Failed to remove saved search')
      return
    }
    toast().success('Saved search removed')
    await fetch()
  }

  async function init() {
    const auth = useAuthStore()
    if (auth.user) {
      await fetch()
    }
  }

  return { items, loading, fetch, add, remove, init }
})
