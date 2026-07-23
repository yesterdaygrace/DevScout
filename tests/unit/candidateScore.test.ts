import { describe, it, expect } from 'vitest'
import { useCandidateScore } from '../../src/composables/useCandidateScore'
import type { GitHubUser, GitHubRepo } from '../../src/types/github'

const { calculateScore, getScoreColor, getScoreLabel } = useCandidateScore()

function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: 'testuser',
    id: 1,
    avatar_url: '',
    html_url: '',
    name: 'Test User',
    company: null,
    blog: '',
    location: null,
    bio: null,
    public_repos: 10,
    public_gists: 0,
    followers: 50,
    following: 10,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    html_url: '',
    description: null,
    language: 'TypeScript',
    stargazers_count: 100,
    forks_count: 10,
    fork: false,
    topics: [],
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    pushed_at: '2024-06-01T00:00:00Z',
    ...overrides,
  }
}

describe('useCandidateScore', () => {
  describe('calculateScore', () => {
    it('should return a score between 0-100', () => {
      const result = calculateScore(makeUser(), [makeRepo()])
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(100)
    })

    it('should return higher score for active user with many repos', () => {
      const weakUser = makeUser({ public_repos: 1, followers: 0, created_at: '2024-01-01T00:00:00Z' })
      const strongUser = makeUser({ public_repos: 50, followers: 500, created_at: '2015-01-01T00:00:00Z' })
      const repos = Array.from({ length: 20 }, (_, i) => makeRepo({ stargazers_count: 200, updated_at: '2024-06-01T00:00:00Z' }))

      const weak = calculateScore(weakUser, repos)
      const strong = calculateScore(strongUser, repos)
      expect(strong.total).toBeGreaterThan(weak.total)
    })

    it('should include 6 factor breakdown as array', () => {
      const result = calculateScore(makeUser(), [makeRepo()])
      expect(result.factors).toBeDefined()
      expect(result.factors).toHaveLength(6)
      expect(result.factors[0].name).toBe('Repository Quality')
      expect(result.factors[1].name).toBe('Open Source Activity')
      expect(result.factors[2].name).toBe('Language Diversity')
      expect(result.factors[3].name).toBe('Community Engagement')
      expect(result.factors[4].name).toBe('Recent Activity')
      expect(result.factors[5].name).toBe('Project Consistency')
    })

    it('should identify strengths and weaknesses', () => {
      const user = makeUser({ public_repos: 30, followers: 200, blog: 'https://example.com', bio: 'A dev' })
      const repos = Array.from({ length: 30 }, (_, i) => makeRepo({
        language: i % 2 === 0 ? 'TypeScript' : 'Python',
        stargazers_count: 100,
        updated_at: '2024-06-01T00:00:00Z',
      }))
      const result = calculateScore(user, repos)
      expect(result.strengths).toBeDefined()
      expect(result.weaknesses).toBeDefined()
    })

    it('should return rank label', () => {
      const result = calculateScore(makeUser(), [makeRepo()])
      expect(result.rank).toBeDefined()
      expect(typeof result.rank).toBe('string')
    })
  })

  describe('getScoreColor', () => {
    it('should return green for high scores', () => {
      expect(getScoreColor(80)).toContain('green')
    })
    it('should return yellow for medium scores', () => {
      expect(getScoreColor(50)).toContain('yellow')
    })
    it('should return red for low scores', () => {
      expect(getScoreColor(20)).toContain('red')
    })
  })

  describe('getScoreLabel', () => {
    it('should return Exceptional for 86+', () => {
      expect(getScoreLabel(90)).toBe('Exceptional')
    })
    it('should return Strong for 71-85', () => {
      expect(getScoreLabel(75)).toBe('Strong')
    })
    it('should return Solid for 56-70', () => {
      expect(getScoreLabel(60)).toBe('Solid')
    })
    it('should return Developing for 41-55', () => {
      expect(getScoreLabel(50)).toBe('Developing')
    })
    it('should return Emerging for ≤40', () => {
      expect(getScoreLabel(20)).toBe('Emerging')
    })
  })
})
