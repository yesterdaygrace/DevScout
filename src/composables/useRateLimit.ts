import { ref, onMounted, onUnmounted } from 'vue'
import { onRateLimitUpdate, isUsingPAT } from '../services/githubService'
import { logger } from '../utils/debug'

export function useRateLimit() {
  const remaining = ref<number | null>(null)
  const limit = ref<number | null>(null)
  const resetAt = ref<number | null>(null)
  const isLow = ref(false)
  const hasPAT = isUsingPAT()

  function update(r: number, l: number, reset: number) {
    remaining.value = r
    limit.value = l
    resetAt.value = reset
    isLow.value = r < 20
    logger.debug('RATE_LIMIT', 'updated', { remaining: r, limit: l })
  }

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    unsubscribe = onRateLimitUpdate(update)
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return { remaining, limit, resetAt, isLow, hasPAT }
}
