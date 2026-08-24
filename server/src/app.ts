import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'

import { requestId } from './middleware/request-id.js'
import { logger } from './middleware/logger.js'
import { rateLimit } from './middleware/rate-limit.js'
import { health } from './routes/health.js'
import { github } from './routes/github.js'
import { score } from './routes/score.js'

const app = new Hono()

// Global middleware
app.use('*', requestId)
app.use('*', logger)
app.use('/api/*', rateLimit)
app.use('/api/*', cors({
  origin: ['http://localhost:4000', 'http://localhost:4173'],
  credentials: true,
}))

// Routes
app.route('/health', health)
app.route('/api/github', github)
app.route('/api/score', score)

// OpenAPI docs
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

app.get('/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.3',
    info: { title: 'Talent Directory API', version: '1.0.0', description: 'Backend proxy for GitHub Developer Sourcing' },
    servers: [{ url: '/', description: 'Local dev' }],
    paths: {
      '/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
      '/api/github/search/users': { get: { summary: 'Search GitHub users', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Search results' } } } },
      '/api/github/users/{username}': { get: { summary: 'Get GitHub user', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User profile' } } } },
      '/api/github/users/{username}/repos': { get: { summary: 'Get user repos', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Repository list' } } } },
      '/api/github/users/{username}/languages': { get: { summary: 'Get language breakdown', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Language breakdown' } } } },
      '/api/score/{username}': { get: { summary: 'Calculate candidate score', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Score result' } } } },
    },
  })
})

export default app
