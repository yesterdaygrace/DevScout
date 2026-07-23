export interface HandledError {
  message: string
  context: string
  timestamp: Date
  type: 'error' | 'warning' | 'info'
}

interface AxiosLikeError {
  response?: {
    status?: number
    data?: { message?: string }
  }
  message?: string
}

interface SupabaseError {
  error?: { message?: string }
  message?: string
}

function isAxiosError(e: unknown): e is AxiosLikeError {
  return typeof e === 'object' && e !== null && 'response' in e
}

function isSupabaseError(e: unknown): e is SupabaseError {
  return typeof e === 'object' && e !== null && 'error' in e
}

function isStandardError(e: unknown): e is Error {
  return e instanceof Error
}

export function handleError(error: unknown, context: string): HandledError {
  const timestamp = new Date()

  // Null/undefined
  if (error === null || error === undefined) {
    return { message: 'An unexpected error occurred', context, timestamp, type: 'error' }
  }

  // Standard Error
  if (isStandardError(error)) {
    return { message: error.message || 'An unexpected error occurred', context, timestamp, type: 'error' }
  }

  // Axios error
  if (isAxiosError(error)) {
    const status = error.response?.status
    const dataMessage = error.response?.data?.message

    if (status === 403) {
      return { message: 'GitHub API rate limit reached. Please try again later.', context, timestamp, type: 'warning' }
    }
    if (status === 429) {
      return { message: 'Too many requests. Please wait a moment and try again.', context, timestamp, type: 'warning' }
    }
    if (status && status >= 500) {
      return { message: 'A server error occurred. Please try again later.', context, timestamp, type: 'error' }
    }
    return { message: dataMessage || error.message || 'A network error occurred', context, timestamp, type: 'error' }
  }

  // Supabase error
  if (isSupabaseError(error)) {
    const msg = error.error?.message || error.message
    if (msg) {
      return { message: msg, context, timestamp, type: 'error' }
    }
  }

  // String error
  if (typeof error === 'string') {
    return { message: error, context, timestamp, type: 'error' }
  }

  // Unknown
  return { message: 'An unexpected error occurred', context, timestamp, type: 'error' }
}
