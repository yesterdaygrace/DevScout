import { ref } from 'vue'
import type { DeveloperActivitySummary } from '../types/github'
import { getUserActivity } from '../services/githubService'

export function useDeveloperActivity() {
  const activity = ref<DeveloperActivitySummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(username: string): Promise<DeveloperActivitySummary | null> {
    if (!username) return null
    loading.value = true
    error.value = null
    try {
      const data = await getUserActivity(username)
      activity.value = data
      return data
    } catch (err: any) {
      error.value = err?.message || 'Failed to load activity'
      return null
    } finally {
      loading.value = false
    }
  }

  function reset() {
    activity.value = null
    loading.value = false
    error.value = null
  }

  return {
    activity,
    loading,
    error,
    load,
    reset,
  }
}
