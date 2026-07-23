import { describe, it, expect } from 'vitest'
import type { SkillBreakdown } from '../../src/types/github'

function normalizeSkillBreakdown(languages: Record<string, number>): SkillBreakdown[] {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
  if (total === 0) return []

  return Object.entries(languages)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

describe('skillBreakdown logic', () => {
  it('should return empty array for empty input', () => {
    expect(normalizeSkillBreakdown({})).toEqual([])
  })

  it('should calculate percentages correctly', () => {
    const result = normalizeSkillBreakdown({ TypeScript: 8000, JavaScript: 2000 })
    expect(result).toHaveLength(2)
    expect(result[0].language).toBe('TypeScript')
    expect(result[0].percentage).toBe(80)
    expect(result[1].language).toBe('JavaScript')
    expect(result[1].percentage).toBe(20)
  })

  it('should sort by percentage descending', () => {
    const result = normalizeSkillBreakdown({ Ruby: 3000, Python: 7000, Go: 5000 })
    expect(result.map(r => r.language)).toEqual(['Python', 'Go', 'Ruby'])
  })

  it('should handle single language', () => {
    const result = normalizeSkillBreakdown({ Rust: 10000 })
    expect(result).toHaveLength(1)
    expect(result[0].percentage).toBe(100)
  })
})
