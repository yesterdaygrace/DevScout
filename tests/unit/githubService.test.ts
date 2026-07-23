import { describe, it, expect } from 'vitest'

// Test the pure logic extracted from api/github.ts
// We test the aggregation logic since the actual API calls need network

function aggregateLanguages(repos: { full_name: string; languages: Record<string, number>; fork: boolean }[]) {
  const aggregated: Record<string, number> = {}
  let failed = 0

  const reposToAnalyze = repos.filter(r => !r.fork).slice(0, 20)

  for (const repo of reposToAnalyze) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      aggregated[lang] = (aggregated[lang] || 0) + bytes
    }
  }

  const total = Object.values(aggregated).reduce((sum, bytes) => sum + bytes, 0)
  if (total === 0) return []

  return Object.entries(aggregated)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

describe('github skill aggregation logic', () => {
  it('should return empty for no repos', () => {
    expect(aggregateLanguages([])).toEqual([])
  })

  it('should aggregate languages across repos', () => {
    const repos = [
      { full_name: 'u/repo1', languages: { TypeScript: 5000, JavaScript: 1000 }, fork: false },
      { full_name: 'u/repo2', languages: { TypeScript: 3000, CSS: 2000 }, fork: false },
    ]
    const result = aggregateLanguages(repos)
    expect(result[0].language).toBe('TypeScript')
    expect(result[0].bytes).toBe(8000)
    expect(result[0].percentage).toBe(72.7)
    expect(result.find(r => r.language === 'JavaScript')?.bytes).toBe(1000)
    expect(result.find(r => r.language === 'CSS')?.bytes).toBe(2000)
  })

  it('should exclude forked repos', () => {
    const repos = [
      { full_name: 'u/original', languages: { TypeScript: 1000 }, fork: false },
      { full_name: 'u/forked', languages: { Go: 5000 }, fork: true },
    ]
    const result = aggregateLanguages(repos)
    expect(result).toHaveLength(1)
    expect(result[0].language).toBe('TypeScript')
  })

  it('should limit to 20 repos', () => {
    const repos = Array.from({ length: 30 }, (_, i) => ({
      full_name: `u/repo${i}`,
      languages: { TypeScript: 100 },
      fork: false,
    }))
    const result = aggregateLanguages(repos)
    expect(result).toHaveLength(1)
    expect(result[0].bytes).toBe(2000) // 20 * 100
  })

  it('should handle all repos being forks', () => {
    const repos = [
      { full_name: 'u/fork1', languages: { Go: 1000 }, fork: true },
    ]
    expect(aggregateLanguages(repos)).toEqual([])
  })

  it('should sort by percentage descending', () => {
    const repos = [
      { full_name: 'u/r', languages: { Ruby: 100, Python: 900 }, fork: false },
    ]
    const result = aggregateLanguages(repos)
    expect(result[0].language).toBe('Python')
    expect(result[1].language).toBe('Ruby')
  })
})
