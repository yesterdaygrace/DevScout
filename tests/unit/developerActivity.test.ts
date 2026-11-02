import { describe, it, expect } from 'vitest'
import { getUserActivity } from '../../src/services/githubService'
import { useCandidateScore } from '../../src/composables/useCandidateScore'
import type { GitHubUser, GitHubRepo, DeveloperActivitySummary } from '../../src/types/github'

function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: 'testdev',
    id: 101,
    avatar_url: 'https://example.com/avatar.png',
    html_url: 'https://github.com/testdev',
    repos_url: 'https://api.github.com/users/testdev/repos',
    name: 'Test Dev',
    company: 'Acme Inc',
    blog: 'https://example.com',
    location: 'Remote',
    email: 'test@example.com',
    bio: 'Software engineer',
    public_repos: 20,
    followers: 150,
    following: 30,
    created_at: '2019-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    id: 1,
    name: 'repo-one',
    full_name: 'testdev/repo-one',
    html_url: 'https://github.com/testdev/repo-one',
    description: 'High quality open source tool',
    language: 'TypeScript',
    stargazers_count: 500,
    forks_count: 50,
    fork: false,
    topics: ['typescript', 'vue'],
    updated_at: new Date().toISOString(),
    open_issues_count: 2,
    ...overrides,
  }
}

function makeMockActivity(overrides: Partial<DeveloperActivitySummary> = {}): DeveloperActivitySummary {
  const dummyDays = [
    { date: '2026-10-01', count: 3, level: 2 as const },
    { date: '2026-10-02', count: 5, level: 3 as const },
  ]
  const dummyWeeks = Array.from({ length: 52 }, () => ({
    days: dummyDays,
  }))

  return {
    calendar: {
      totalContributions: 320,
      weeks: dummyWeeks,
    },
    consistency: {
      activeWeeks: 45,
      totalWeeks: 52,
      activeWeeksRatio: 0.86,
      currentStreak: 6,
      longestStreak: 21,
      tier: 'Exceptional',
    },
    pullRequests: {
      total: 40,
      merged: 36,
      closed: 4,
      open: 0,
      mergeRate: 90,
      recent: [
        {
          id: 101,
          title: 'feat: add reactive batch processing',
          repo: 'external-org/core',
          state: 'merged',
          url: 'https://github.com/external-org/core/pull/101',
          createdAt: '2026-10-10T00:00:00Z',
          mergedAt: '2026-10-11T00:00:00Z',
          isExternal: true,
        },
      ],
    },
    externalContributions: [
      {
        repo: 'external-org/core',
        owner: 'external-org',
        isExternal: true,
        stargazersCount: 15000,
        commitCount: 12,
        prCount: 4,
        url: 'https://github.com/external-org/core',
      },
    ],
    ownedContributions: [
      {
        repo: 'testdev/repo-one',
        owner: 'testdev',
        isExternal: false,
        stargazersCount: 500,
        commitCount: 45,
        prCount: 10,
        url: 'https://github.com/testdev/repo-one',
      },
    ],
    recentProjects: [
      {
        repo: 'external-org/core',
        lastActive: '2026-10-11T00:00:00Z',
        commitCount: 12,
        prCount: 4,
        url: 'https://github.com/external-org/core',
      },
    ],
    hasPrivateActivityDisclaimer: true,
    ...overrides,
  }
}

describe('Developer Activity & Recruiter Intelligence', () => {
  it('getUserActivity returns a structured activity payload', async () => {
    const activity = await getUserActivity('testdev')
    expect(activity).toBeDefined()
    expect(activity.calendar.weeks.length).toBeGreaterThanOrEqual(52)
    expect(activity.consistency.totalWeeks).toBe(52)
    expect(['Exceptional', 'Consistent', 'Moderate', 'Sporadic', 'Dormant']).toContain(
      activity.consistency.tier
    )
    expect(activity.pullRequests.mergeRate).toBeGreaterThanOrEqual(0)
    expect(activity.pullRequests.recent.length).toBeGreaterThan(0)
    expect(activity.hasPrivateActivityDisclaimer).toBe(true)
  })

  it('calculates candidate score with enriched activity consistency', () => {
    const { calculateScore } = useCandidateScore()
    const user = makeUser({ public_repos: 5 }) // Low repo count
    const repos = [makeRepo()]
    const activity = makeMockActivity()

    // Without activity, low repo count gives lower consistency
    const legacyScore = calculateScore(user, repos)
    const consistencyWithoutActivity = legacyScore.factors.find(f => f.name === 'Project Consistency')

    // With activity (45/52 weeks active), consistency score is based on actual contributions!
    const enrichedScore = calculateScore(user, repos, activity)
    const consistencyWithActivity = enrichedScore.factors.find(f => f.name === 'Project Consistency')

    expect(consistencyWithActivity?.score).toBe(100)
    expect(consistencyWithActivity?.detail).toContain('Exceptional consistency')
    expect(consistencyWithActivity?.score).toBeGreaterThan(consistencyWithoutActivity?.score || 0)
  })

  it('rewards high PR merge rate in Recent Activity factor', () => {
    const { calculateScore } = useCandidateScore()
    const user = makeUser()
    const repos = [makeRepo()]
    const highMergeActivity = makeMockActivity({
      pullRequests: {
        total: 20,
        merged: 18,
        closed: 2,
        open: 0,
        mergeRate: 90,
        recent: [],
      },
    })

    const result = calculateScore(user, repos, highMergeActivity)
    const recentActivityFactor = result.factors.find(f => f.name === 'Recent Activity')

    expect(recentActivityFactor?.detail).toContain('90% PR merge acceptance')
  })
})
