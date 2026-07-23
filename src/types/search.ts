export interface SearchFilters {
  username?: string
  language?: string
  location?: string
  minFollowers?: number
  minRepos?: number
  organization?: string
  minPushed?: string // ISO date string (e.g. "2024-01-01") for pushed:> filter
  openSourceContributors?: boolean
  topics?: string        // comma-separated, maps to topic: qualifier
  minStars?: number      // minimum star count, maps to stars:>=N
  joinedSince?: string   // ISO date, maps to created:>YYYY-MM-DD
  hasPortfolio?: boolean // has website/blog, maps to has:portfolio
  sort?: 'followers' | 'repositories' | 'joined'
  order?: 'desc' | 'asc'
}

export interface SearchHistoryItem {
  id: string
  query: string
  filters?: SearchFilters
  timestamp: string
}
