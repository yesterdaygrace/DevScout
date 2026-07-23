import { describe, it, expect } from 'vitest'
import { exportShortlistAsCSV, exportShortlistAsJSON } from '../../src/utils/export'
import type { ShortlistItem, Note } from '../../src/types/domain'

const fakeShortlist: ShortlistItem[] = [
  { id: '1', user_id: 'u1', github_username: 'torvalds', created_at: '2024-01-15T10:00:00Z' },
  { id: '2', user_id: 'u1', github_username: 'gaearon', created_at: '2024-01-16T12:00:00Z' },
]

const fakeNotes: Note[] = [
  { id: '1', user_id: 'u1', github_username: 'torvalds', content: 'Linux creator', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
]

describe('export', () => {
  describe('exportShortlistAsCSV', () => {
    it('should produce CSV with header row', () => {
      const csv = exportShortlistAsCSV(fakeShortlist, [])
      expect(csv).toContain('github_username,notes,shortlisted_at')
    })

    it('should include each shortlisted username', () => {
      const csv = exportShortlistAsCSV(fakeShortlist, [])
      expect(csv).toContain('torvalds')
      expect(csv).toContain('gaearon')
    })

    it('should include notes when available', () => {
      const csv = exportShortlistAsCSV(fakeShortlist, fakeNotes)
      expect(csv).toContain('"Linux creator"')
    })

    it('should escape double quotes in notes', () => {
      const notesWithQuotes: Note[] = [
        { id: '1', user_id: 'u1', github_username: 'torvalds', content: 'He said "hello"', created_at: '2024-01-15', updated_at: '2024-01-15' },
      ]
      const csv = exportShortlistAsCSV(fakeShortlist, notesWithQuotes)
      expect(csv).toContain('"He said ""hello"""')
    })

    it('should return header only when list is empty', () => {
      const csv = exportShortlistAsCSV([], [])
      expect(csv).toBe('github_username,notes,shortlisted_at')
    })
  })

  describe('exportShortlistAsJSON', () => {
    it('should produce valid JSON', () => {
      const json = exportShortlistAsJSON(fakeShortlist, fakeNotes)
      const parsed = JSON.parse(json)
      expect(Array.isArray(parsed)).toBe(true)
    })

    it('should include all shortlisted users', () => {
      const json = exportShortlistAsJSON(fakeShortlist, [])
      const parsed = JSON.parse(json)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].github_username).toBe('torvalds')
      expect(parsed[1].github_username).toBe('gaearon')
    })

    it('should include note content when available', () => {
      const json = exportShortlistAsJSON(fakeShortlist, fakeNotes)
      const parsed = JSON.parse(json)
      expect(parsed[0].note).toBe('Linux creator')
      expect(parsed[1].note).toBe('')
    })

    it('should include shortlisted_at timestamp', () => {
      const json = exportShortlistAsJSON(fakeShortlist, [])
      const parsed = JSON.parse(json)
      expect(parsed[0].shortlisted_at).toBe('2024-01-15T10:00:00Z')
    })

    it('should return empty array JSON for empty list', () => {
      const json = exportShortlistAsJSON([], [])
      expect(json).toBe('[]')
    })
  })
})
