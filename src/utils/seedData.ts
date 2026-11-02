import type { SearchHistoryItem, SearchFilters } from '../types/search'

export interface MockRow {
  id: string
  user_id: string
  [key: string]: unknown
}

const TALENT_SEARCH_TEMPLATES: Array<{ query: string; filters: SearchFilters }> = [
  // TypeScript Frontend & Fullstack
  { query: 'language:TypeScript react senior frontend', filters: { language: 'TypeScript', location: 'Remote', minFollowers: 30 } },
  { query: 'language:TypeScript nextjs fullstack architect', filters: { language: 'TypeScript', location: 'San Francisco' } },
  { query: 'language:TypeScript vue core maintainer', filters: { language: 'TypeScript' } },
  { query: 'language:TypeScript node microservices backend', filters: { language: 'TypeScript', location: 'London' } },
  { query: 'language:TypeScript design system tailwind', filters: { language: 'TypeScript', hasPortfolio: true } },
  { query: 'language:TypeScript webgl threejs graphics', filters: { language: 'TypeScript', minStars: 100 } },
  { query: 'language:TypeScript graphql apollo engineer', filters: { language: 'TypeScript' } },
  { query: 'language:TypeScript electron desktop developer', filters: { language: 'TypeScript', minRepos: 15 } },
  { query: 'language:TypeScript svelte performance lead', filters: { language: 'TypeScript' } },
  { query: 'language:TypeScript compiler ast typescript', filters: { language: 'TypeScript', minStars: 200 } },
  { query: 'yyx990803', filters: { language: 'TypeScript' } },
  { query: 'gaearon', filters: { language: 'TypeScript' } },
  { query: 'shadcn', filters: { language: 'TypeScript' } },
  { query: 'leerob', filters: { language: 'TypeScript', location: 'Remote' } },
  { query: 't3dotgg', filters: { language: 'TypeScript' } },
  { query: 'rich-harris', filters: { language: 'TypeScript' } },
  { query: 'kentcdodds', filters: { language: 'TypeScript' } },
  { query: 'evanw', filters: { language: 'TypeScript' } },
  { query: 'developit', filters: { language: 'TypeScript' } },
  { query: 'sindresorhus', filters: { language: 'TypeScript', minFollowers: 500 } },
  { query: 'language:TypeScript location:"New York" react', filters: { language: 'TypeScript', location: 'New York' } },
  { query: 'language:TypeScript location:Berlin frontend', filters: { language: 'TypeScript', location: 'Berlin' } },
  { query: 'language:TypeScript location:Amsterdam fullstack', filters: { language: 'TypeScript', location: 'Amsterdam' } },
  { query: 'language:TypeScript location:Tokyo mobile', filters: { language: 'TypeScript', location: 'Tokyo' } },
  { query: 'language:TypeScript location:Seattle cloud', filters: { language: 'TypeScript', location: 'Seattle' } },
  { query: 'language:TypeScript location:Toronto nodejs', filters: { language: 'TypeScript', location: 'Toronto' } },
  { query: 'language:TypeScript good-first-issues:>0 contributor', filters: { language: 'TypeScript', openSourceContributors: true } },
  { query: 'language:TypeScript followers:>100 frontend', filters: { language: 'TypeScript', minFollowers: 100 } },
  { query: 'language:TypeScript repos:>30 open source', filters: { language: 'TypeScript', minRepos: 30 } },
  { query: 'language:TypeScript stars:>500 library author', filters: { language: 'TypeScript', minStars: 500 } },
  { query: 'language:TypeScript vite plugin author', filters: { language: 'TypeScript' } },
  { query: 'language:TypeScript trpc prisma fullstack', filters: { language: 'TypeScript', location: 'Remote' } },

  // Python AI, ML, Data & Backend
  { query: 'language:Python machine learning pytorch', filters: { language: 'Python', topics: 'machine-learning,pytorch' } },
  { query: 'language:Python deep learning transformer', filters: { language: 'Python', minStars: 200 } },
  { query: 'language:Python computer vision opencv', filters: { language: 'Python', location: 'San Francisco' } },
  { query: 'language:Python fastapi async backend', filters: { language: 'Python', location: 'Berlin' } },
  { query: 'language:Python django senior engineer', filters: { language: 'Python', location: 'Remote' } },
  { query: 'language:Python data science pandas numpy', filters: { language: 'Python', minRepos: 20 } },
  { query: 'language:Python nlp huggingface llm', filters: { language: 'Python', minFollowers: 80 } },
  { query: 'language:Python reinforcement learning gym', filters: { language: 'Python' } },
  { query: 'language:Python mlops airflow kubeflow', filters: { language: 'Python', location: 'London' } },
  { query: 'karpathy', filters: { language: 'Python' } },
  { query: 'lucidrains', filters: { language: 'Python' } },
  { query: 'geohot', filters: { language: 'Python' } },
  { query: 'tiangolo', filters: { language: 'Python', minFollowers: 200 } },
  { query: 'tloen', filters: { language: 'Python' } },
  { query: 'language:Python location:Zurich ai researcher', filters: { language: 'Python', location: 'Zurich' } },
  { query: 'language:Python location:Boston robotics', filters: { language: 'Python', location: 'Boston' } },
  { query: 'language:Python location:Austin data engineering', filters: { language: 'Python', location: 'Austin' } },
  { query: 'language:Python quant algorithmic trading', filters: { language: 'Python', location: 'Chicago' } },
  { query: 'language:Python web scraping crawler', filters: { language: 'Python' } },
  { query: 'language:Python langchain agent developer', filters: { language: 'Python', topics: 'langchain,agents' } },
  { query: 'language:Python generative ai diffusion', filters: { language: 'Python', minStars: 300 } },
  { query: 'language:Python flask microservices', filters: { language: 'Python' } },
  { query: 'language:Python jupyter core contributor', filters: { language: 'Python', openSourceContributors: true } },
  { query: 'language:Python scientific computing scipy', filters: { language: 'Python' } },

  // JavaScript Fullstack & Ecosystem
  { query: 'language:JavaScript nodejs performance architect', filters: { language: 'JavaScript', location: 'Remote' } },
  { query: 'language:JavaScript express api developer', filters: { language: 'JavaScript', location: 'London' } },
  { query: 'language:JavaScript canvas animation creative', filters: { language: 'JavaScript', hasPortfolio: true } },
  { query: 'language:JavaScript react native mobile', filters: { language: 'JavaScript', location: 'San Francisco' } },
  { query: 'language:JavaScript babel bundler tooling', filters: { language: 'JavaScript', minStars: 150 } },
  { query: 'language:JavaScript electron desktop app', filters: { language: 'JavaScript' } },
  { query: 'addyosmani', filters: { language: 'JavaScript' } },
  { query: 'mrdoob', filters: { language: 'JavaScript' } },
  { query: 'mathiasbynens', filters: { language: 'JavaScript' } },
  { query: 'tj', filters: { language: 'JavaScript', minFollowers: 500 } },
  { query: 'language:JavaScript location:Paris web dev', filters: { language: 'JavaScript', location: 'Paris' } },
  { query: 'language:JavaScript location:Berlin fullstack', filters: { language: 'JavaScript', location: 'Berlin' } },
  { query: 'language:JavaScript websocket real-time', filters: { language: 'JavaScript', minRepos: 25 } },
  { query: 'language:JavaScript testing vitest jest', filters: { language: 'JavaScript' } },
  { query: 'language:JavaScript frontend performance web vitals', filters: { language: 'JavaScript', minFollowers: 50 } },
  { query: 'language:JavaScript ui component library', filters: { language: 'JavaScript', minStars: 200 } },
  { query: 'language:JavaScript webpack plugin author', filters: { language: 'JavaScript' } },
  { query: 'language:JavaScript serverless lambda node', filters: { language: 'JavaScript', location: 'Remote' } },

  // Go (Golang) Cloud & Distributed
  { query: 'language:Go distributed systems kubernetes', filters: { language: 'Go', location: 'San Francisco', minFollowers: 40 } },
  { query: 'language:Go grpc microservices backend', filters: { language: 'Go', location: 'Berlin' } },
  { query: 'language:Go docker container runtime', filters: { language: 'Go', minStars: 250 } },
  { query: 'language:Go cloud native prometheus', filters: { language: 'Go', location: 'London' } },
  { query: 'mitchellh', filters: { language: 'Go', minFollowers: 500 } },
  { query: 'armon', filters: { language: 'Go' } },
  { query: 'matryer', filters: { language: 'Go' } },
  { query: 'language:Go database engine storage', filters: { language: 'Go', minStars: 100 } },
  { query: 'language:Go high concurrency network', filters: { language: 'Go', location: 'Remote' } },
  { query: 'language:Go cli devtools cobra', filters: { language: 'Go', minRepos: 20 } },
  { query: 'language:Go raft consensus algorithm', filters: { language: 'Go' } },
  { query: 'language:Go location:Singapore backend', filters: { language: 'Go', location: 'Singapore' } },

  // Rust Systems & Performance
  { query: 'language:Rust systems performance backend', filters: { language: 'Rust', location: 'Berlin', minStars: 100 } },
  { query: 'language:Rust webassembly wasm runtime', filters: { language: 'Rust', location: 'Remote' } },
  { query: 'language:Rust compiler llvm internals', filters: { language: 'Rust', minFollowers: 80 } },
  { query: 'language:Rust async tokio network', filters: { language: 'Rust', location: 'London' } },
  { query: 'burntsushi', filters: { language: 'Rust' } },
  { query: 'dtolnay', filters: { language: 'Rust', minFollowers: 200 } },
  { query: 'alexcrichton', filters: { language: 'Rust' } },
  { query: 'jonhoo', filters: { language: 'Rust' } },
  { query: 'language:Rust embedded no-std firmware', filters: { language: 'Rust', minRepos: 15 } },

  // Java, Kotlin, C++, C Systems
  { query: 'language:Java spring boot cloud microservices', filters: { language: 'Java', location: 'Munich' } },
  { query: 'language:Java high throughput fin-tech', filters: { language: 'Java', location: 'London' } },
  { query: 'language:Kotlin android jetpack compose architect', filters: { language: 'Kotlin', location: 'San Francisco' } },
  { query: 'language:C++ low latency trading engine', filters: { language: 'C++', location: 'Chicago', minFollowers: 50 } },
  { query: 'torvalds', filters: { language: 'C', minFollowers: 500 } },
]

export function generateTalentSearches(count = 100): SearchHistoryItem[] {
  const items: SearchHistoryItem[] = []
  const now = new Date()

  // Target:
  // - 16 searches today
  // - 11 searches yesterday (trend = +45%)
  // - 73 searches spread across days 2..29
  const dayCounts: number[] = [16, 11]
  const remainingCount = count - 16 - 11 // 73
  const numDays = 28 // days 2 to 29

  let allocated = 0
  for (let d = 2; d < 30; d++) {
    const isEnd = d === 29
    const val = isEnd ? remainingCount - allocated : Math.min(Math.max(1, Math.round(remainingCount / numDays + (Math.sin(d * 1.7) * 1.5))), remainingCount - allocated)
    dayCounts.push(val)
    allocated += val
  }

  let templateIdx = 0

  for (let dayOffset = 0; dayOffset < dayCounts.length; dayOffset++) {
    const dayCount = dayCounts[dayOffset]
    const dayDate = new Date(now.getTime() - dayOffset * 86400000)
    const dateStr = dayDate.toISOString().split('T')[0]

    for (let i = 0; i < dayCount; i++) {
      if (items.length >= count) break

      const tpl = TALENT_SEARCH_TEMPLATES[templateIdx % TALENT_SEARCH_TEMPLATES.length]
      templateIdx++

      const hour = Math.min(23, Math.max(0, 8 + Math.floor((i / Math.max(1, dayCount)) * 14)))
      const minute = Math.floor((i * 17 + 7) % 60)
      const second = Math.floor((i * 23 + 13) % 60)
      const timestamp = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`

      items.push({
        id: `search-seed-${dayOffset}-${i}-${Date.now().toString(36)}`,
        query: tpl.query,
        filters: tpl.filters,
        timestamp,
      })
    }
  }

  // Sort descending by timestamp (newest first)
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function generateDefaultMockDb(): Record<string, MockRow[]> {
  const userId = 'demo-user'
  const now = new Date()
  const daysAgo = (d: number, hours = 0) => new Date(now.getTime() - (d * 86400000 + hours * 3600000)).toISOString()

  return {
    profiles: [
      {
        id: userId,
        user_id: userId,
        email: 'demo@dev.local',
        display_name: 'demo',
        created_at: daysAgo(30),
      },
    ],
    collections: [
      { id: 'col-1', user_id: userId, name: 'Senior Frontend Architects', created_at: daysAgo(4) },
      { id: 'col-2', user_id: userId, name: 'Rust & Systems Specialists', created_at: daysAgo(6) },
      { id: 'col-3', user_id: userId, name: 'AI & Machine Learning Leads', created_at: daysAgo(10) },
      { id: 'col-4', user_id: userId, name: 'Cloud & Distributed Systems', created_at: daysAgo(12) },
    ],
    collection_members: [
      { id: 'cm-1', user_id: userId, collection_id: 'col-1', github_username: 'yyx990803', created_at: daysAgo(4) },
      { id: 'cm-2', user_id: userId, collection_id: 'col-1', github_username: 'gaearon', created_at: daysAgo(4) },
      { id: 'cm-3', user_id: userId, collection_id: 'col-1', github_username: 'evanw', created_at: daysAgo(3) },
      { id: 'cm-4', user_id: userId, collection_id: 'col-1', github_username: 'rich-harris', created_at: daysAgo(3) },

      { id: 'cm-5', user_id: userId, collection_id: 'col-2', github_username: 'burntsushi', created_at: daysAgo(6) },
      { id: 'cm-6', user_id: userId, collection_id: 'col-2', github_username: 'dtolnay', created_at: daysAgo(6) },
      { id: 'cm-7', user_id: userId, collection_id: 'col-2', github_username: 'alexcrichton', created_at: daysAgo(5) },
      { id: 'cm-8', user_id: userId, collection_id: 'col-2', github_username: 'jonhoo', created_at: daysAgo(5) },

      { id: 'cm-9', user_id: userId, collection_id: 'col-3', github_username: 'karpathy', created_at: daysAgo(10) },
      { id: 'cm-10', user_id: userId, collection_id: 'col-3', github_username: 'lucidrains', created_at: daysAgo(10) },
      { id: 'cm-11', user_id: userId, collection_id: 'col-3', github_username: 'geohot', created_at: daysAgo(9) },
      { id: 'cm-12', user_id: userId, collection_id: 'col-3', github_username: 'tloen', created_at: daysAgo(9) },

      { id: 'cm-13', user_id: userId, collection_id: 'col-4', github_username: 'mitchellh', created_at: daysAgo(12) },
      { id: 'cm-14', user_id: userId, collection_id: 'col-4', github_username: 'armon', created_at: daysAgo(12) },
      { id: 'cm-15', user_id: userId, collection_id: 'col-4', github_username: 'crossbuild', created_at: daysAgo(11) },
      { id: 'cm-16', user_id: userId, collection_id: 'col-4', github_username: 'matryer', created_at: daysAgo(11) },
    ],
    shortlist: [
      { id: 'sl-1', user_id: userId, github_username: 'torvalds', created_at: daysAgo(2) },
      { id: 'sl-2', user_id: userId, github_username: 'antirez', created_at: daysAgo(3) },
      { id: 'sl-3', user_id: userId, github_username: 'yyx990803', created_at: daysAgo(0, 2) },
      { id: 'sl-4', user_id: userId, github_username: 'gaearon', created_at: daysAgo(0, 3) },
      { id: 'sl-5', user_id: userId, github_username: 'sindresorhus', created_at: daysAgo(4) },
      { id: 'sl-6', user_id: userId, github_username: 'shadcn', created_at: daysAgo(0, 1) },
      { id: 'sl-7', user_id: userId, github_username: 'leerob', created_at: daysAgo(5) },
      { id: 'sl-8', user_id: userId, github_username: 't3dotgg', created_at: daysAgo(1) },
    ],
    saved_searches: [
      { id: 'ss-1', user_id: userId, query: 'language:TypeScript react senior frontend', filters: { language: 'TypeScript', location: 'Remote', minFollowers: 30 }, created_at: daysAgo(3) },
      { id: 'ss-2', user_id: userId, query: 'language:Rust systems performance backend', filters: { language: 'Rust', location: 'Berlin', minStars: 100 }, created_at: daysAgo(5) },
      { id: 'ss-3', user_id: userId, query: 'language:Python machine learning pytorch', filters: { language: 'Python', topics: 'pytorch,machine-learning' }, created_at: daysAgo(7) },
      { id: 'ss-4', user_id: userId, query: 'language:Go distributed systems kubernetes', filters: { language: 'Go', location: 'San Francisco', minFollowers: 40 }, created_at: daysAgo(8) },
      { id: 'ss-5', user_id: userId, query: 'language:TypeScript location:San Francisco', filters: { language: 'TypeScript', location: 'San Francisco' }, created_at: daysAgo(12) },
    ],
    recently_viewed: [
      { id: 'rv-1', user_id: userId, github_username: 'torvalds', viewed_at: daysAgo(0, 0.25) },
      { id: 'rv-2', user_id: userId, github_username: 'antirez', viewed_at: daysAgo(0, 0.75) },
      { id: 'rv-3', user_id: userId, github_username: 'yyx990803', viewed_at: daysAgo(0, 1.2) },
      { id: 'rv-4', user_id: userId, github_username: 'gaearon', viewed_at: daysAgo(0, 2.5) },
      { id: 'rv-5', user_id: userId, github_username: 'sindresorhus', viewed_at: daysAgo(0, 3.8) },
      { id: 'rv-6', user_id: userId, github_username: 'shadcn', viewed_at: daysAgo(0, 4.5) },
    ],
    notes: [
      { id: 'nt-1', user_id: userId, github_username: 'gaearon', content: 'Co-creator of Redux and Create React App. Pioneer of developer experience tooling.', tags: ['react', 'dx', 'lead'], created_at: daysAgo(2), updated_at: daysAgo(2) },
      { id: 'nt-2', user_id: userId, github_username: 'yyx990803', content: 'Creator of Vue.js and Vite. Master of progressive frontend architectures.', tags: ['vue', 'vite', 'tooling'], created_at: daysAgo(2), updated_at: daysAgo(2) },
      { id: 'nt-3', user_id: userId, github_username: 'antirez', content: 'Creator of Redis. Exceptional expertise in C, memory structures, and high throughput.', tags: ['redis', 'c', 'systems'], created_at: daysAgo(3), updated_at: daysAgo(3) },
    ],
  }
}

export function generateRecentlyCompared(): string[] {
  return ['torvalds', 'antirez', 'gaearon', 'yyx990803', 'shadcn', 'leerob']
}

export function generateActivityFeed() {
  const now = new Date()
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()

  return [
    { id: 'act-1', type: 'shortlist_add' as const, label: 'Shortlisted Developer', description: 'shadcn', timestamp: minsAgo(45) },
    { id: 'act-2', type: 'compare' as const, label: 'Compared Developers', description: 'torvalds vs antirez', timestamp: minsAgo(90) },
    { id: 'act-3', type: 'shortlist_add' as const, label: 'Shortlisted Developer', description: 'yyx990803', timestamp: minsAgo(140) },
    { id: 'act-4', type: 'collection_add' as const, label: 'Collection Updated', description: 'Added 4 devs to Senior Frontend Architects', timestamp: minsAgo(240) },
    { id: 'act-5', type: 'search_save' as const, label: 'Saved Search', description: 'language:TypeScript react senior frontend', timestamp: daysAgo(1) },
    { id: 'act-6', type: 'note_create' as const, label: 'Created Note', description: 'Interview notes for gaearon', timestamp: daysAgo(2) },
    { id: 'act-7', type: 'shortlist_add' as const, label: 'Shortlisted Developer', description: 'torvalds', timestamp: daysAgo(2) },
    { id: 'act-8', type: 'collection_add' as const, label: 'Created Collection', description: 'Rust & Systems Specialists', timestamp: daysAgo(3) },
  ]
}

export function seedDashboardData(force = false): boolean {
  if (typeof localStorage === 'undefined') return false

  const existingHistory = localStorage.getItem('search_history')
  const historyLen = existingHistory ? JSON.parse(existingHistory).length : 0

  if (!force && historyLen > 1) {
    return false
  }

  const searches = generateTalentSearches(100)
  const mockDb = generateDefaultMockDb()
  const compared = generateRecentlyCompared()
  const activity = generateActivityFeed()

  localStorage.setItem('search_history', JSON.stringify(searches))
  localStorage.setItem('devscout_mock_db', JSON.stringify(mockDb))
  localStorage.setItem('recently_compared', JSON.stringify(compared))
  localStorage.setItem('dashboard_activity', JSON.stringify(activity))
  localStorage.setItem('github_api_remaining', '58')
  localStorage.setItem('github_api_limit', '60')
  localStorage.setItem('github_api_reset', String(Date.now() + 3600000))

  return true
}
