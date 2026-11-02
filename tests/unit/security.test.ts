import { describe, it, expect } from 'vitest'
import app from '../../server/src/app'
import { proxyFetch } from '../../server/src/services/github'

describe('Security & Hardening Suite', () => {
  describe('Security Headers', () => {
    it('sets strict security headers on all responses', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)

      // X-Frame-Options
      expect(res.headers.get('x-frame-options')).toBe('DENY')

      // X-Content-Type-Options
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')

      // Referrer-Policy
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')

      // Strict-Transport-Security (HSTS)
      const hsts = res.headers.get('strict-transport-security')
      expect(hsts).toBeDefined()
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')

      // Permissions-Policy
      const permissions = res.headers.get('permissions-policy')
      expect(permissions).toBeDefined()
      expect(permissions).toContain('camera=()')
      expect(permissions).toContain('microphone=()')
      expect(permissions).toContain('geolocation=()')

      // Content-Security-Policy (CSP)
      const csp = res.headers.get('content-security-policy')
      expect(csp).toBeDefined()
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain('https://*.supabase.co')
      expect(csp).toContain('https://api.github.com')
      expect(csp).toContain('https://avatars.githubusercontent.com')
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("frame-ancestors 'none'")
    })
  })

  describe('Input Validation Boundaries', () => {
    it('rejects oversized search queries (>256 characters)', async () => {
      const longQuery = 'a'.repeat(300)
      const res = await app.request(`/api/github/search/users?q=${longQuery}`)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toHaveProperty('error')
    })

    it('rejects search queries with page exceeding 100', async () => {
      const res = await app.request('/api/github/search/users?q=test&page=105')
      expect(res.status).toBe(400)
    })

    it('rejects invalid or oversized usernames in /api/github/users/:username', async () => {
      const invalidUser = 'invalid@user#name!'
      const res1 = await app.request(`/api/github/users/${invalidUser}`)
      expect(res1.status).toBe(400)

      const tooLongUser = 'a'.repeat(45)
      const res2 = await app.request(`/api/github/users/${tooLongUser}`)
      expect(res2.status).toBe(400)
    })

    it('rejects oversized owner/repo parameters in /repos/:owner/:repo/languages', async () => {
      const oversized = 'a'.repeat(150)
      const res = await app.request(`/api/github/repos/${oversized}/test-repo/languages`)
      expect(res.status).toBe(400)
    })
  })

  describe('SSRF & Path Traversal Guard in proxyFetch', () => {
    it('rejects paths not beginning with /', async () => {
      await expect(proxyFetch('users/torvalds')).rejects.toThrow('Invalid or disallowed proxy path')
    })

    it('rejects paths with double slash // (protocol-relative SSRF)', async () => {
      await expect(proxyFetch('//evil.com/users')).rejects.toThrow('Invalid or disallowed proxy path')
    })

    it('rejects path traversal attempts with /../', async () => {
      await expect(proxyFetch('/users/../internal')).rejects.toThrow('Invalid or disallowed proxy path')
    })
  })
})
