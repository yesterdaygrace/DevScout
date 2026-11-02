import { Cache } from '../lib/cache.js'
import { proxyFetch } from './github.js'

export interface ContributionDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ContributionWeek {
  days: ContributionDay[]
}

export interface ConsistencyStats {
  activeWeeks: number
  totalWeeks: number
  activeWeeksRatio: number
  currentStreak: number
  longestStreak: number
  tier: 'Exceptional' | 'Consistent' | 'Moderate' | 'Sporadic' | 'Dormant'
}

export interface PRSummaryItem {
  id: number
  title: string
  repo: string
  state: 'merged' | 'closed' | 'open'
  url: string
  createdAt: string
  closedAt?: string | null
  mergedAt?: string | null
  isExternal: boolean
}

export interface PRStats {
  total: number
  merged: number
  closed: number
  open: number
  mergeRate: number
  recent: PRSummaryItem[]
}

export interface RepoContribution {
  repo: string
  owner: string
  isExternal: boolean
  description?: string | null
  stargazersCount?: number
  commitCount?: number
  prCount?: number
  lastActive?: string
  url: string
}

export interface RecentProjectActivity {
  repo: string
  lastActive: string
  commitCount: number
  prCount: number
  url: string
}

export interface DeveloperActivitySummary {
  calendar: {
    totalContributions: number
    weeks: ContributionWeek[]
  }
  consistency: ConsistencyStats
  pullRequests: PRStats
  externalContributions: RepoContribution[]
  ownedContributions: RepoContribution[]
  recentProjects: RecentProjectActivity[]
  hasPrivateActivityDisclaimer: boolean
}

const activityCache = new Cache<DeveloperActivitySummary>(5 * 60 * 1000, 100)

const LEVEL_MAP: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

function computeConsistency(weeks: ContributionWeek[]): ConsistencyStats {
  const totalWeeks = weeks.length || 52
  let activeWeeks = 0
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  const allDays = weeks.flatMap(w => w.days)

  for (const day of allDays) {
    if (day.count > 0) {
      tempStreak++
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    } else {
      tempStreak = 0
    }
  }

  // Calculate current streak counting backwards from the last day
  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i]
    if (day && day.count > 0) {
      currentStreak++
    } else if (i === allDays.length - 1) {
      // today might not have a commit yet, check yesterday before resetting
      continue
    } else {
      break
    }
  }

  for (const week of weeks) {
    const weekCount = week.days.reduce((sum, d) => sum + d.count, 0)
    if (weekCount > 0) {
      activeWeeks++
    }
  }

  const activeWeeksRatio = totalWeeks > 0 ? Math.round((activeWeeks / totalWeeks) * 100) / 100 : 0

  let tier: ConsistencyStats['tier'] = 'Dormant'
  if (activeWeeksRatio >= 0.75) tier = 'Exceptional'
  else if (activeWeeksRatio >= 0.50) tier = 'Consistent'
  else if (activeWeeksRatio >= 0.25) tier = 'Moderate'
  else if (activeWeeksRatio > 0.05) tier = 'Sporadic'

  return {
    activeWeeks,
    totalWeeks,
    activeWeeksRatio,
    currentStreak,
    longestStreak,
    tier,
  }
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 9) return 3
  return 4
}

function generateDefaultWeeks(): ContributionWeek[] {
  const weeks: ContributionWeek[] = []
  const now = new Date()

  for (let w = 51; w >= 0; w--) {
    const days: ContributionDay[] = []
    for (let d = 6; d >= 0; d--) {
      const dayOffset = w * 7 + d
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() - dayOffset)
      days.push({
        date: targetDate.toISOString().split('T')[0] ?? '',
        count: 0,
        level: 0,
      })
    }
    weeks.push({ days })
  }
  return weeks
}

export async function fetchGraphQLActivity(username: string): Promise<DeveloperActivitySummary | null> {
  const pat = process.env.GITHUB_PAT
  if (!pat) return null

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
          commitContributionsByRepository(maxRepositories: 25) {
            repository {
              name
              nameWithOwner
              isPrivate
              isFork
              stargazerCount
              description
              owner {
                login
              }
              url
            }
            contributions(first: 1) {
              totalCount
            }
          }
          pullRequestContributions(first: 25, orderBy: { direction: DESC }) {
            totalCount
            nodes {
              pullRequest {
                number
                title
                state
                merged
                mergedAt
                closedAt
                createdAt
                url
                repository {
                  nameWithOwner
                  owner {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${pat}`,
        'Content-Type': 'application/json',
        'User-Agent': 'talent-dir-api/1.0',
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    })

    if (!res.ok) {
      return null
    }

    const json = (await res.json()) as { data?: { user?: { contributionsCollection?: any } }; errors?: any[] }
    if (json.errors || !json.data?.user?.contributionsCollection) {
      return null
    }

    const coll = json.data.user.contributionsCollection
    const rawCalendar = coll.contributionCalendar

    const weeks: ContributionWeek[] = (rawCalendar.weeks || []).map((w: any) => ({
      days: (w.contributionDays || []).map((d: any) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVEL_MAP[d.contributionLevel] ?? countToLevel(d.contributionCount),
      })),
    }))

    const consistency = computeConsistency(weeks)

    // Parse PR contributions
    const rawPRNodes = coll.pullRequestContributions?.nodes || []
    const prRecent: PRSummaryItem[] = []
    let mergedCount = 0
    let closedCount = 0
    let openCount = 0

    for (const node of rawPRNodes) {
      const pr = node?.pullRequest
      if (!pr) continue
      const isMerged = Boolean(pr.merged)
      const isClosed = pr.state === 'CLOSED' && !isMerged
      const isOpen = pr.state === 'OPEN'

      if (isMerged) mergedCount++
      else if (isClosed) closedCount++
      else if (isOpen) openCount++

      const repoOwner = pr.repository?.owner?.login || ''
      const isExternal = repoOwner.toLowerCase() !== username.toLowerCase()

      prRecent.push({
        id: pr.number,
        title: pr.title,
        repo: pr.repository?.nameWithOwner || '',
        state: isMerged ? 'merged' : isClosed ? 'closed' : 'open',
        url: pr.url,
        createdAt: pr.createdAt,
        closedAt: pr.closedAt,
        mergedAt: pr.mergedAt,
        isExternal,
      })
    }

    const totalPRs = coll.pullRequestContributions?.totalCount || prRecent.length
    const evaluatedCount = mergedCount + closedCount
    const mergeRate = evaluatedCount > 0 ? Math.round((mergedCount / evaluatedCount) * 100) : (totalPRs > 0 ? 100 : 0)

    // Parse repository contributions
    const rawRepos = coll.commitContributionsByRepository || []
    const externalContributions: RepoContribution[] = []
    const ownedContributions: RepoContribution[] = []
    const recentProjectsMap = new Map<string, RecentProjectActivity>()

    for (const item of rawRepos) {
      const repo = item.repository
      if (!repo) continue
      const owner = repo.owner?.login || ''
      const isExternal = owner.toLowerCase() !== username.toLowerCase()
      const commitCount = item.contributions?.totalCount || 0

      const entry: RepoContribution = {
        repo: repo.nameWithOwner,
        owner,
        isExternal,
        description: repo.description,
        stargazersCount: repo.stargazerCount || 0,
        commitCount,
        url: repo.url,
      }

      if (isExternal) {
        externalContributions.push(entry)
      } else {
        ownedContributions.push(entry)
      }

      recentProjectsMap.set(repo.nameWithOwner, {
        repo: repo.nameWithOwner,
        lastActive: new Date().toISOString(),
        commitCount,
        prCount: 0,
        url: repo.url,
      })
    }

    // Blend PR counts into recent projects
    for (const pr of prRecent) {
      if (pr.repo) {
        const existing = recentProjectsMap.get(pr.repo)
        if (existing) {
          existing.prCount++
        } else {
          recentProjectsMap.set(pr.repo, {
            repo: pr.repo,
            lastActive: pr.createdAt,
            commitCount: 0,
            prCount: 1,
            url: pr.url,
          })
        }
      }
    }

    return {
      calendar: {
        totalContributions: rawCalendar.totalContributions || 0,
        weeks,
      },
      consistency,
      pullRequests: {
        total: totalPRs,
        merged: mergedCount,
        closed: closedCount,
        open: openCount,
        mergeRate,
        recent: prRecent.slice(0, 20),
      },
      externalContributions,
      ownedContributions,
      recentProjects: Array.from(recentProjectsMap.values()).slice(0, 10),
      hasPrivateActivityDisclaimer: true,
    }
  } catch {
    return null
  }
}

export async function fetchRestActivity(username: string): Promise<DeveloperActivitySummary> {
  const weeks = generateDefaultWeeks()
  const dateToDay = new Map<string, ContributionDay>()
  weeks.forEach(w => w.days.forEach(d => dateToDay.set(d.date, d)))

  let totalContributions = 0
  const recentProjectsMap = new Map<string, RecentProjectActivity>()
  const externalContributionsMap = new Map<string, RepoContribution>()
  const ownedContributionsMap = new Map<string, RepoContribution>()

  // 1. Fetch public events
  try {
    const eventsRes = await proxyFetch(`/users/${username}/events/public`, { per_page: '100' })
    if (eventsRes.ok) {
      const events = (await eventsRes.json()) as any[]
      if (Array.isArray(events)) {
        for (const ev of events) {
          const dateStr = (ev.created_at || '').split('T')[0]
          const repoName = ev.repo?.name || ''
          const repoOwner = repoName.split('/')[0] || ''
          const isExternal = repoOwner.toLowerCase() !== username.toLowerCase()

          let eventContributions = 0
          if (ev.type === 'PushEvent') {
            const commitCount = ev.payload?.commits?.length || 1
            eventContributions = commitCount
            totalContributions += commitCount

            const proj = recentProjectsMap.get(repoName) || {
              repo: repoName,
              lastActive: ev.created_at,
              commitCount: 0,
              prCount: 0,
              url: `https://github.com/${repoName}`,
            }
            proj.commitCount += commitCount
            recentProjectsMap.set(repoName, proj)

            const repoTargetMap = isExternal ? externalContributionsMap : ownedContributionsMap
            const existingContribution = repoTargetMap.get(repoName) || {
              repo: repoName,
              owner: repoOwner,
              isExternal,
              commitCount: 0,
              prCount: 0,
              lastActive: ev.created_at,
              url: `https://github.com/${repoName}`,
            }
            existingContribution.commitCount = (existingContribution.commitCount || 0) + commitCount
            repoTargetMap.set(repoName, existingContribution)
          } else if (ev.type === 'PullRequestEvent') {
            eventContributions = 1
            totalContributions += 1

            const proj = recentProjectsMap.get(repoName) || {
              repo: repoName,
              lastActive: ev.created_at,
              commitCount: 0,
              prCount: 0,
              url: `https://github.com/${repoName}`,
            }
            proj.prCount += 1
            recentProjectsMap.set(repoName, proj)

            const repoTargetMap = isExternal ? externalContributionsMap : ownedContributionsMap
            const existingContribution = repoTargetMap.get(repoName) || {
              repo: repoName,
              owner: repoOwner,
              isExternal,
              commitCount: 0,
              prCount: 0,
              lastActive: ev.created_at,
              url: `https://github.com/${repoName}`,
            }
            existingContribution.prCount = (existingContribution.prCount || 0) + 1
            repoTargetMap.set(repoName, existingContribution)
          } else if (ev.type === 'CreateEvent' || ev.type === 'IssuesEvent') {
            eventContributions = 1
            totalContributions += 1
          }

          if (dateStr && dateToDay.has(dateStr)) {
            const day = dateToDay.get(dateStr)!
            day.count += eventContributions
            day.level = countToLevel(day.count)
          }
        }
      }
    }
  } catch {
    // Events fetch gracefully handled
  }

  // 2. Fetch PRs via search issues API
  const prRecent: PRSummaryItem[] = []
  let totalPRs = 0
  let mergedCount = 0
  let closedCount = 0
  let openCount = 0

  try {
    const prRes = await proxyFetch('/search/issues', {
      q: `author:${username}+type:pr`,
      per_page: '30',
    })
    if (prRes.ok) {
      const prData = (await prRes.json()) as any
      totalPRs = prData.total_count || 0
      const items = prData.items || []

      for (const item of items) {
        const isMerged = Boolean(item.pull_request?.merged_at)
        const isClosed = item.state === 'closed' && !isMerged
        const isOpen = item.state === 'open'

        if (isMerged) mergedCount++
        else if (isClosed) closedCount++
        else if (isOpen) openCount++

        // Extract repository from repository_url
        // e.g. "https://api.github.com/repos/facebook/react" -> "facebook/react"
        const repoFullName = item.repository_url
          ? item.repository_url.replace('https://api.github.com/repos/', '')
          : ''
        const repoOwner = repoFullName.split('/')[0] || ''
        const isExternal = repoOwner.toLowerCase() !== username.toLowerCase()

        prRecent.push({
          id: item.number,
          title: item.title,
          repo: repoFullName,
          state: isMerged ? 'merged' : isClosed ? 'closed' : 'open',
          url: item.html_url,
          createdAt: item.created_at,
          closedAt: item.closed_at,
          mergedAt: item.pull_request?.merged_at,
          isExternal,
        })
      }
    }
  } catch {
    // PR search gracefully handled
  }

  const evaluatedCount = mergedCount + closedCount
  const mergeRate = evaluatedCount > 0 ? Math.round((mergedCount / evaluatedCount) * 100) : (totalPRs > 0 ? 100 : 0)
  const consistency = computeConsistency(weeks)

  return {
    calendar: {
      totalContributions,
      weeks,
    },
    consistency,
    pullRequests: {
      total: totalPRs,
      merged: mergedCount,
      closed: closedCount,
      open: openCount,
      mergeRate,
      recent: prRecent,
    },
    externalContributions: Array.from(externalContributionsMap.values()),
    ownedContributions: Array.from(ownedContributionsMap.values()),
    recentProjects: Array.from(recentProjectsMap.values()).slice(0, 10),
    hasPrivateActivityDisclaimer: true,
  }
}

export async function getDeveloperActivity(username: string): Promise<DeveloperActivitySummary> {
  const cached = activityCache.get(username)
  if (cached) return cached

  // Try GraphQL first
  const graphqlResult = await fetchGraphQLActivity(username)
  if (graphqlResult) {
    activityCache.set(username, graphqlResult)
    return graphqlResult
  }

  // Fallback to REST
  const restResult = await fetchRestActivity(username)
  activityCache.set(username, restResult)
  return restResult
}
