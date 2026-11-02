export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  html_url: string
  repos_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
  twitter_username?: string | null
}

export interface GitHubSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubUser[]
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  fork: boolean
  topics: string[]
  updated_at: string
  open_issues_count: number
}

export interface GitHubRepoLanguage {
  [language: string]: number
}

export interface SkillBreakdown {
  language: string
  percentage: number
  bytes: number
}

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

