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
