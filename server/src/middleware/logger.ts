import { createMiddleware } from 'hono/factory'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  method: string
  path: string
  status: number
  duration: number
  requestId: string
  error?: string
}

const color: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
}

function log(entry: LogEntry) {
  const ts = new Date().toISOString()
  const c = color[entry.level]
  const prefix = `${ts} [${c}${entry.level.toUpperCase()}\x1b[0m]`
  const msg = `${prefix} ${entry.method} ${entry.path} ${entry.status} ${entry.duration}ms ${entry.requestId}`
  if (entry.error) {
    console.error(msg, entry.error)
  } else if (entry.level === 'warn') {
    console.warn(msg)
  } else {
    console.log(msg)
  }
}

export const logger = createMiddleware(async (c, next) => {
  const start = Date.now()
  const { method } = c.req
  const path = c.req.path

  await next()

  const duration = Date.now() - start
  const level: LogLevel = c.res.status >= 500 ? 'error' : c.res.status >= 400 ? 'warn' : 'info'

  log({
    level,
    method,
    path,
    status: c.res.status,
    duration,
    requestId: c.get('requestId') || 'unknown',
  })
})
