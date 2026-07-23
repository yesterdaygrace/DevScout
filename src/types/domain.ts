export interface Profile {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface ShortlistItem {
  id: string
  user_id: string
  github_username: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  github_username: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface RecentlyViewed {
  id: string
  user_id: string
  github_username: string
  viewed_at: string
}

export interface SavedSearch {
  id: string
  user_id: string
  query: string
  filters?: any
  created_at: string
}
