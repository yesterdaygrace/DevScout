/**
 * Retry wrapper with exponential backoff for transient failures.
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  /** Return true to retry, false to throw immediately. */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

const defaultShouldRetry = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const status = (error as { response?: { status?: number } }).response?.status
    return status === 429 || (status !== undefined && status >= 500)
  }
  return false
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = defaultShouldRetry,
  } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt < maxRetries && shouldRetry(error, attempt)) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
        console.warn(`[retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Unreachable')
}
