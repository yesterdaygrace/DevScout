import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import type { ShortlistItem } from '../types/domain'
import { useAuthStore } from './auth'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

export const useShortlistStore = defineStore('shortlist', () => {
  const items = ref<ShortlistItem[]>([])
  const loading = ref(false)

  function toast() { return useToastStore() }

  async function fetch() {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SHORTLIST', 'fetch skipped — no user'); return }

    loading.value = true
    logger.info('SHORTLIST', 'fetch', { userId: auth.user.id })
    const { data, error } = await supabase
      .from('shortlist')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (error) logger.error('SHORTLIST', 'fetch failed', error)
    if (data) { items.value = data; logger.info('SHORTLIST', 'fetch OK', { count: data.length }) }
    loading.value = false
  }

  async function add(githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SHORTLIST', 'add skipped — no user'); return }

    logger.info('SHORTLIST', 'add', { githubUsername })
    const { error } = await supabase
      .from('shortlist')
      .insert({ user_id: auth.user.id, github_username: githubUsername })
    if (error) {
      logger.error('SHORTLIST', 'add failed', error, { githubUsername })
      toast().error(`Failed to shortlist ${githubUsername}`)
      return
    }
    toast().success(`${githubUsername} shortlisted`)
    await fetch()
  }

  async function remove(githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('SHORTLIST', 'remove skipped — no user'); return }

    logger.info('SHORTLIST', 'remove', { githubUsername })
    const { error } = await supabase
      .from('shortlist')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('github_username', githubUsername)
    if (error) {
      logger.error('SHORTLIST', 'remove failed', error, { githubUsername })
      toast().error(`Failed to remove ${githubUsername} from shortlist`)
      return
    }
    toast().success(`${githubUsername} removed from shortlist`)
    await fetch()
  }

  function isShortlisted(username: string): boolean {
    return items.value.some(item => item.github_username === username)
  }

  return { items, loading, fetch, add, remove, isShortlisted }
})
