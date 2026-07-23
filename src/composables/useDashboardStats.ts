import { computed, ref } from 'vue'
import { useShortlistStore } from '../stores/shortlist'
import { useRecentlyViewedStore } from '../stores/recentlyViewed'
import { useNotesStore } from '../stores/notes'
import { useSavedSearchesStore } from '../stores/savedSearches'
import { useCollectionsStore } from '../stores/collections'
import { useSearchHistory } from './useSearchHistory'

export interface ActivityEvent {
  id: string
  type: 'compare' | 'collection_add' | 'search_save' | 'note_create' | 'shortlist_add' | 'import'
  label: string
  description: string
  timestamp: string
}

export interface InsightData {
  topLanguages: { name: string; count: number }[]
  peakTime: string
  avgSearchesPerDay: number
  totalDevsViewed: number
}

const ACTIVITY_KEY = 'dashboard_activity'

export function useDashboardStats() {
  const shortlistStore = useShortlistStore()
  const recentlyViewedStore = useRecentlyViewedStore()
  const notesStore = useNotesStore()
  const savedSearchesStore = useSavedSearchesStore()
  const collectionsStore = useCollectionsStore()
  const { history: searchHistory } = useSearchHistory()

  // --- Activity Feed ---
  const activityFeed = ref<ActivityEvent[]>([])

  function loadActivity(): ActivityEvent[] {
    try {
      const stored = localStorage.getItem(ACTIVITY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  function saveActivity(events: ActivityEvent[]) {
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(events.slice(0, 50)))
    } catch { /* ignore quota errors */ }
  }

  function addActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
    const events = loadActivity()
    events.unshift({ ...event, id: `${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString() })
    activityFeed.value = events.slice(0, 10)
    saveActivity(events)
  }

  const visibleActivity = computed(() => {
    if (activityFeed.value.length > 0) return activityFeed.value
    // Fallback: derive from existing stores
    const derived: ActivityEvent[] = []
    for (const s of savedSearchesStore.items.slice(0, 3)) {
      derived.push({ id: `saved-${s.id}`, type: 'search_save', label: 'Saved Search', description: s.query, timestamp: s.created_at })
    }
    for (const n of notesStore.notes.slice(0, 3)) {
      derived.push({ id: `note-${n.id}`, type: 'note_create', label: 'Created Note', description: n.github_username || 'unknown', timestamp: n.created_at })
    }
    return derived.slice(0, 10)
  })

  // --- KPI Metrics ---
  const kpiMetrics = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const todaySearches = searchHistory.value.filter(h => h.timestamp.startsWith(today)).length
    const yesterdaySearches = searchHistory.value.filter(h => h.timestamp.startsWith(yesterday)).length
    const searchTrend = yesterdaySearches > 0 ? Math.round(((todaySearches - yesterdaySearches) / yesterdaySearches) * 100) : 0

    const shortlistToday = shortlistStore.items.filter(i => i.created_at?.startsWith(today)).length

    const totalMembers = collectionsStore.collections.reduce((s, c) => s + (c.members?.length || 0), 0)

    const langFreq: Record<string, number> = {}
    for (const h of searchHistory.value) {
      const fl = (h.filters as { language?: string } | null)?.language
      if (fl) langFreq[fl] = (langFreq[fl] || 0) + 1
    }
    const mostUsedLang = Object.entries(langFreq).sort((a, b) => b[1] - a[1])[0]
    const mostUsedSaved = mostUsedLang ? mostUsedLang[0] : '—'

    return {
      searches: { total: searchHistory.value.length, today: todaySearches, yesterday: yesterdaySearches, trend: searchTrend },
      collections: { total: collectionsStore.collections.length, totalMembers },
      shortlisted: { total: shortlistStore.items.length, addedToday: shortlistToday },
      savedSearches: { total: savedSearchesStore.items.length, mostUsed: mostUsedSaved },
    }
  })

  // --- Search Analytics ---
  const searchAnalytics = computed(() => {
    const counts: Record<string, number> = {}
    for (const h of searchHistory.value) {
      const day = h.timestamp.slice(0, 10)
      counts[day] = (counts[day] || 0) + 1
    }
    const sortedDays = Object.keys(counts).sort()
    return {
      daily: sortedDays.map(d => ({ date: d, count: counts[d] })),
      total: searchHistory.value.length,
      unique: new Set(searchHistory.value.map(h => h.query)).size,
      today: counts[new Date().toISOString().split('T')[0]] || 0,
    }
  })

  // --- Language Distribution ---
  const languageDistribution = computed(() => {
    const langCount: Record<string, number> = {}
    for (const h of searchHistory.value) {
      const fl = (h.filters as { language?: string } | null)?.language
      if (fl) langCount[fl] = (langCount[fl] || 0) + 1
    }
    const total = Object.values(langCount).reduce((s, v) => s + v, 0) || 1
    return Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
  })

  // --- Insights ---
  const insights = computed<InsightData>(() => {
    const langCount: Record<string, number> = {}
    for (const h of searchHistory.value) {
      const fl = (h.filters as { language?: string } | null)?.language
      if (fl) langCount[fl] = (langCount[fl] || 0) + 1
    }
    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }))

    // Peak search time
    const hours = searchHistory.value.map(h => new Date(h.timestamp).getHours()).filter(h => !isNaN(h))
    const hourCounts: Record<number, number> = {}
    for (const h of hours) hourCounts[h] = (hourCounts[h] || 0) + 1
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
    const peakTime = peakHour ? `${String(peakHour[0]).padStart(2, '0')}:00` : '—'

    const daysActive = new Set(searchHistory.value.map(h => h.timestamp.slice(0, 10))).size || 1
    const avgSearchesPerDay = Math.round((searchHistory.value.length / daysActive) * 10) / 10

    return {
      topLanguages,
      peakTime,
      avgSearchesPerDay,
      totalDevsViewed: recentlyViewedStore.items.length || 0,
    }
  })

  // --- API Usage (from localStorage) ---
  const apiUsage = computed(() => {
    const remaining = Number(localStorage.getItem('github_api_remaining') || '60')
    const limit = Number(localStorage.getItem('github_api_limit') || '60')
    const resetTime = localStorage.getItem('github_api_reset') || ''
    return { remaining, limit, used: limit - remaining, resetTime }
  })

  return {
    kpiMetrics,
    searchAnalytics,
    languageDistribution,
    collectionsStore,
    recentlyViewedStore,
    shortlistStore,
    savedSearchesStore,
    insights,
    activityFeed: visibleActivity,
    apiUsage,
    addActivity,
    loadActivity,
  }
}
