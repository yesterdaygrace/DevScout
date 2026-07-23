import { ref } from 'vue'
import { getSkillBreakdown } from '../services/githubService'
import type { SkillBreakdown } from '../types/github'

export function useSkillBreakdown() {
  const skills = ref<SkillBreakdown[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(username: string) {
    loading.value = true
    error.value = null
    try {
      skills.value = await getSkillBreakdown(username)
    } catch (e) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { status?: number } }).response?.status === 403
          ? 'GitHub API rate limit reached.'
          : 'Failed to load skill breakdown'
        : 'Failed to load skill breakdown'
      error.value = msg
      skills.value = []
    } finally {
      loading.value = false
    }
  }

  return { skills, loading, error, load }
}
