import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeCsvField } from '../../src/utils/sanitize'

describe('sanitize utility', () => {
  describe('sanitizeHtml', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('allows safe formatting tags and attributes', () => {
      const safe = '<p>Hello <strong>world</strong>, check <a href="https://example.com" target="_blank" rel="noopener">link</a></p>'
      const sanitized = sanitizeHtml(safe)
      expect(sanitized).toContain('<strong>world</strong>')
      expect(sanitized).toContain('href="https://example.com"')
    })

    it('strips <script> tags and malicious payloads', () => {
      const malicious = '<script>alert(1)</script><p>Safe content</p>'
      const sanitized = sanitizeHtml(malicious)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert(1)')
      expect(sanitized).toContain('Safe content')
    })

    it('strips inline event handlers (onerror, onload, onclick)', () => {
      const malicious = '<img src="x" onerror="alert(document.cookie)" /><b onclick="alert(1)">click</b>'
      const sanitized = sanitizeHtml(malicious)
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('document.cookie')
    })

    it('strips javascript: and data: URL schemes in links', () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a><a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data link</a>'
      const sanitized = sanitizeHtml(malicious)
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('data:text/html')
    })

    it('strips dangerous tags like iframe, object, embed, style, form', () => {
      const malicious = '<iframe src="https://evil.com"></iframe><object data="test.swf"></object><style>body { display: none; }</style><form action="/evil"><input name="pw" /></form>'
      const sanitized = sanitizeHtml(malicious)
      expect(sanitized).not.toContain('<iframe')
      expect(sanitized).not.toContain('<object')
      expect(sanitized).not.toContain('<style')
      expect(sanitized).not.toContain('<form')
      expect(sanitized).not.toContain('<input')
    })
  })

  describe('sanitizeCsvField', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeCsvField('')).toBe('')
    })

    it('leaves standard text untouched', () => {
      expect(sanitizeCsvField('normal text')).toBe('normal text')
      expect(sanitizeCsvField('torvalds')).toBe('torvalds')
    })

    it('prepends single quote to formula injection prefixes', () => {
      expect(sanitizeCsvField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeCsvField('+12345')).toBe("'+12345")
      expect(sanitizeCsvField('-12345')).toBe("'-12345")
      expect(sanitizeCsvField('@username')).toBe("'@username")
      expect(sanitizeCsvField('\tcmd')).toBe("'\tcmd")
      expect(sanitizeCsvField('\rcmd')).toBe("'\rcmd")
      expect(sanitizeCsvField('|calc')).toBe("'|calc")
      expect(sanitizeCsvField('%test')).toBe("'%test")
    })

    it('handles formula injection with leading whitespace', () => {
      expect(sanitizeCsvField('  =cmd|')).toBe("'  =cmd|")
      expect(sanitizeCsvField('  |calc')).toBe("'  |calc")
    })

    it('sanitizes multiline fields with formula injections on subsequent lines', () => {
      const multiline = 'First line safe\n=cmd|\' /C calc\'!A0\nThird line'
      const sanitized = sanitizeCsvField(multiline)
      expect(sanitized).toBe("First line safe\n'=cmd|' /C calc'!A0\nThird line")
    })
  })
})
