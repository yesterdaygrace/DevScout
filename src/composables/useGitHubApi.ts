import { ref, computed } from 'vue'
import { searchUsers, getUser, getUserRepos } from '../services/githubService'
import type { GitHubUser, GitHubRepo } from '../types/github'

async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelay = 1000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const is5xx = e && typeof e === 'object' && 'response' in e
        && typeof (e as { response?: { status?: number } }).response?.status === 'number'
        && (e as { response: { status: number } }).response.status >= 500

      const is429 = e && typeof e === 'object' && 'response' in e
        && (e as { response?: { status?: number } }).response?.status === 429

      if ((is5xx || is429) && attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw e
    }
  }
  throw new Error('Unreachable')
}

export function useGitHubSearch() {
  const results = ref<GitHubUser[]>([])
  const totalCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasMore = computed(() => {
    return results.value.length < totalCount.value
  })

  async function search(query: string, page = 1, append = false) {
    if (!query.trim()) {
      results.value = []
      totalCount.value = 0
      return
    }

    loading.value = true
    error.value = null
    try {
      const data = await withRetry(() => searchUsers(query, page))
      if (append && page > 1) {
        results.value = [...results.value, ...data.items]
      } else {
        results.value = data.items
      }
      totalCount.value = data.total_count
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axiosErr = e as { response?: { status?: number } }
        if (axiosErr.response?.status === 403) {
          error.value = 'GitHub API rate limit reached. Please try again later.'
        } else if (axiosErr.response?.status === 429) {
          error.value = 'Too many requests. Please wait a moment and try again.'
        } else {
          error.value = 'An error occurred while searching. Please try again.'
        }
      } else {
        error.value = 'An error occurred while searching.'
      }
      if (!append) results.value = []
    } finally {
      loading.value = false
    }
  }

  return { results, totalCount, loading, error, hasMore, search }
}

export function useGitHubProfile() {
  const profile = ref<GitHubUser | null>(null)
  const repos = ref<GitHubRepo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(username: string) {
    loading.value = true
    error.value = null
    try {
      const [userData, repoData] = await Promise.all([
        withRetry(() => getUser(username)),
        withRetry(() => getUserRepos(username)),
      ])
      profile.value = userData
      repos.value = repoData
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { status?: number } }).response?.status === 403
          ? 'GitHub API rate limit reached.'
          : 'Failed to load profile'
        : 'Failed to load profile'
      error.value = msg
      profile.value = null
      repos.value = []
    } finally {
      loading.value = false
    }
  }

  return { profile, repos, loading, error, load }
}
