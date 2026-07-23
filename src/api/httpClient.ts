/**
 * Shared Axios instance with timeout, retry, and rate-limit tracking.
 */
import axios from 'axios'
import { withRetry } from '../utils/retry'
import { logger } from '../utils/debug'

const pat = import.meta.env.VITE_GITHUB_PERSONAL_ACCESS_TOKEN || null

export const httpClient = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 15000,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(pat ? { Authorization: `token ${pat}` } : {}),
  },
})

// Request interceptor
httpClient.interceptors.request.use(config => {
  logger.debug('HTTP', `→ ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response interceptor
httpClient.interceptors.response.use(
  response => {
    const remaining = response.headers['x-ratelimit-remaining']
    const limit = response.headers['x-ratelimit-limit']
    if (remaining !== undefined && limit !== undefined) {
      const r = Number(remaining)
      const l = Number(limit)
      logger.debug('HTTP', `← OK (${r}/${l} rate limit)`)
    }
    return response
  },
  error => {
    const status = error.response?.status
    if (status === 403) {
      logger.error('HTTP', 'Rate limited (403)')
    } else if (status === 404) {
      logger.warn('HTTP', 'Not found (404)')
    } else {
      logger.error('HTTP', `HTTP ${status ?? 'unknown'}`, error)
    }
    return Promise.reject(error)
  }
)

/**
 * Convenience wrapper: executes an HTTP request with retry+backoff.
 */
export function requestWithRetry<T>(url: string): Promise<T> {
  return withRetry(() => httpClient.get(url).then(r => r.data as T))
}
