const DEBUG = true

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  source: string
  action: string
  details?: unknown
  error?: unknown
}

const history: LogEntry[] = []
const MAX_HISTORY = 200

function formatTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function log(level: LogLevel, source: string, action: string, details?: unknown, error?: unknown) {
  if (!DEBUG) return

  const entry: LogEntry = { timestamp: formatTimestamp(), level, source, action }

  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${source}]`

  switch (level) {
    case 'error':
      if (error instanceof Error) {
        console.error(`${prefix} ${action}`, details ?? '', `\n  → ${error.name}: ${error.message}`)
        entry.error = { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 3).join('\n') }
      } else {
        console.error(`${prefix} ${action}`, details ?? '', error ?? '')
        entry.error = error
      }
      break
    case 'warn':
      console.warn(`${prefix} ${action}`, details ?? '')
      break
    case 'debug':
      console.debug(`${prefix} ${action}`, details ?? '')
      break
    default:
      console.log(`${prefix} ${action}`, details ?? '')
  }

  history.unshift(entry)
  if (history.length > MAX_HISTORY) history.pop()
}

export const logger = {
  info: (source: string, action: string, details?: unknown) => log('info', source, action, details),
  warn: (source: string, action: string, details?: unknown) => log('warn', source, action, details),
  error: (source: string, action: string, error?: unknown, details?: unknown) => log('error', source, action, details, error),
  debug: (source: string, action: string, details?: unknown) => log('debug', source, action, details),

  // Quick test - call this from browser console to verify logging works
  test: () => {
    console.log('\n═══════════════════════════════════')
    console.log('  Debug Logger Test')
    console.log('═══════════════════════════════════')
    console.log('  Open console and filter by [AUTH] [GITHUB] [DB] [STORE]')
    console.log('  Levels: INFO | WARN | ERROR | DEBUG')
    console.log('═══════════════════════════════════\n')
    logger.info('debug', 'Logger initialized', { historySize: history.length })
  },

  getHistory: () => [...history],

  clearHistory: () => { history.length = 0 },

  // Copy recent logs to clipboard
  copyLogs: (count = 50) => {
    const lines = history.slice(0, count).map(e =>
      `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.source}] ${e.action}${e.details ? ' ' + JSON.stringify(e.details) : ''}${e.error ? ' | ERROR: ' + (typeof e.error === 'object' && e.error !== null && 'message' in e.error ? (e.error as { message: string }).message : JSON.stringify(e.error)) : ''}`
    ).join('\n')
    const text = `=== Debug Logs (${new Date().toISOString()}) ===\n${lines}`
    return text
  },
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__debug = {
    logger,
    getLogs: () => logger.copyLogs(),
    clearLogs: () => logger.clearHistory(),
  }
  logger.test()
}

declare global {
  interface Window {
    __debug: {
      logger: typeof logger
      getLogs: () => string
      clearLogs: () => void
    }
  }
}
