import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import type { RecentlyViewed } from '../types/domain'
import { useAuthStore } from './auth'

export const useRecentlyViewedStore = defineStore('recentlyViewed', () => {
  const items = ref<RecentlyViewed[]>([])
  const loading = ref(false)

  async function fetch() {
    const auth = useAuthStore()
    if (!auth.user) return

    loading.value = true
    const { data } = await supabase
      .from('recently_viewed')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('viewed_at', { ascending: false })
      .limit(10)
    if (data) items.value = data
    loading.value = false
  }

  async function add(githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) return

    await supabase
      .from('recently_viewed')
      .insert({ user_id: auth.user.id, github_username: githubUsername, viewed_at: new Date().toISOString() })
  }

  return { items, loading, fetch, add }
})
