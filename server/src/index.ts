import { serve } from '@hono/node-server'
import app from './app.js'

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down...')
  process.exit(0)
})
process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down...')
  process.exit(0)
})

const port = Number(process.env.PORT) || 4001
console.log(`[SERVER] Talent Directory API running on http://localhost:${port}`)
console.log(`[SERVER] OpenAPI docs at http://localhost:${port}/docs`)

serve({ fetch: app.fetch, port })
