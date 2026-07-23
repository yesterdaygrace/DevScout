import { createMiddleware } from 'hono/factory'
import crypto from 'node:crypto'

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
  }
}

export const requestId = createMiddleware<{ Variables: { requestId: string } }>(async (c, next) => {
  const id = c.req.header('x-request-id') || crypto.randomUUID()
  c.set('requestId', id)
  c.res.headers.set('x-request-id', id)
  await next()
})
