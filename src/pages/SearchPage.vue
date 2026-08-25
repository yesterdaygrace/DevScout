<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGitHubSearch } from '../composables/useGitHubApi'
import { useDebounce } from '../composables/useDebounce'
import { useShortlistStore } from '../stores/shortlist'
import { useCompareStore } from '../stores/compare'
import { useSavedSearchesStore } from '../stores/savedSearches'
import { useSearchHistory } from '../composables/useSearchHistory'
import { MagnifyingGlassIcon, StarIcon as StarOutline, PlusCircleIcon, FunnelIcon, XMarkIcon, ClockIcon, BookmarkIcon as BookmarkOutline } from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/vue/24/solid'
import type { SearchFilters } from '../types/search'

const POPULAR_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Vue', 'React', 'Kotlin', 'Java', 'C++']

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
const weekAgo = daysAgo(7)
const monthAgo = daysAgo(30)
const threeMonthsAgo = daysAgo(90)
const yearAgo = daysAgo(365)

const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 300)
const router = useRouter()
const route = useRoute()
const { results, totalCount, loading, error, search, hasMore } = useGitHubSearch()
const shortlistStore = useShortlistStore()
const compareStore = useCompareStore()
const savedSearchesStore = useSavedSearchesStore()
const { history, addToHistory, removeFromHistory } = useSearchHistory()

const showFilters = ref(false)
const showAdvanced = ref(false)
const currentPage = ref(1)
const filters = ref<SearchFilters>({
  language: '',
  location: '',
  minFollowers: undefined,
  minRepos: undefined,
  organization: '',
  minPushed: '',
  username: '',
  openSourceContributors: false,
  topics: '',
  minStars: undefined,
  joinedSince: '',
  hasPortfolio: false,
  sort: 'followers',
  order: 'desc'
})

const hasActiveFilters = computed(() => {
  return filters.value.language || 
         filters.value.location || 
         filters.value.minFollowers !== undefined || 
         filters.value.minRepos !== undefined ||
         filters.value.organization ||
         filters.value.minPushed ||
         filters.value.username ||
         filters.value.openSourceContributors ||
         filters.value.topics ||
         filters.value.minStars !== undefined ||
         filters.value.joinedSince ||
         filters.value.hasPortfolio
})

const searchHistoryVisible = ref(false)
const showSuggestions = ref(false)
const sentinelRef = ref<HTMLElement | null>(null)
const selectedResultIndex = ref(-1)
const searchInputRef = ref<HTMLInputElement | null>(null)
const resultRefs = ref<(HTMLElement | null)[]>([])
let observer: IntersectionObserver | null = null

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }
  if (results.value.length === 0) return
  const tag = (e.target as HTMLElement)?.tagName
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
  if (e.key === 'j' || e.key === 'J') {
    e.preventDefault()
    if (selectedResultIndex.value < results.value.length - 1) {
      selectedResultIndex.value++
      resultRefs.value[selectedResultIndex.value]?.scrollIntoView({ block: 'nearest' })
    }
  } else if (e.key === 'k' || e.key === 'K') {
    e.preventDefault()
    if (selectedResultIndex.value > 0) {
      selectedResultIndex.value--
      resultRefs.value[selectedResultIndex.value]?.scrollIntoView({ block: 'nearest' })
    }
  } else if (e.key === 'Enter' && selectedResultIndex.value >= 0) {
    e.preventDefault()
    const user = results.value[selectedResultIndex.value]
    if (user) router.push(`/profile/${user.login}`)
  }
}

onMounted(() => {
  shortlistStore.fetch()
  window.addEventListener('keydown', onSearchKeydown)
  const q = route.query.q as string | undefined
  if (q) {
    searchQuery.value = q
    if (route.query.language) filters.value.language = route.query.language as string
    if (route.query.location) filters.value.location = route.query.location as string
    if (route.query.organization) filters.value.organization = route.query.organization as string
    if (route.query.minFollowers) filters.value.minFollowers = Number(route.query.minFollowers)
    if (route.query.minRepos) filters.value.minRepos = Number(route.query.minRepos)
    if (route.query.sort) filters.value.sort = route.query.sort as 'followers' | 'repositories' | 'joined'
    if (route.query.order) filters.value.order = route.query.order as 'desc' | 'asc'
    setTimeout(() => doSearch(), 350)
  }
  setupInfiniteScroll()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onSearchKeydown)
  if (observer) observer.disconnect()
})

function setupInfiniteScroll() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
}

searchQuery.value = ''

function buildGitHubQuery(): string {
  const textQuery = debouncedQuery.value.trim()
  const parts: string[] = []
  if (filters.value.username) parts.push(`user:${filters.value.username}`)
  if (textQuery) parts.push(textQuery)
  if (!parts.length) return ''
  if (filters.value.language) parts.push(`language:${filters.value.language}`)
  if (filters.value.location) parts.push(`location:"${filters.value.location}"`)
  if (filters.value.minFollowers !== undefined && filters.value.minFollowers > 0) parts.push(`followers:>=${filters.value.minFollowers}`)
  if (filters.value.minRepos !== undefined && filters.value.minRepos > 0) parts.push(`repos:>=${filters.value.minRepos}`)
  if (filters.value.organization) parts.push(`org:${filters.value.organization}`)
  if (filters.value.minPushed) parts.push(`pushed:>${filters.value.minPushed}`)
  if (filters.value.openSourceContributors) parts.push(`good-first-issues:>0`)
  if (filters.value.topics) {
    const topics = filters.value.topics.split(',').map(t => t.trim()).filter(Boolean)
    for (const topic of topics) parts.push(`topic:${topic}`)
  }
  if (filters.value.minStars !== undefined && filters.value.minStars > 0) parts.push(`stars:>=${filters.value.minStars}`)
  if (filters.value.joinedSince) parts.push(`created:>${filters.value.joinedSince}`)
  if (filters.value.hasPortfolio) parts.push(`has:portfolio`)
  return parts.join(' ')
}

function doSearch() {
  const query = buildGitHubQuery()
  if (query) {
    currentPage.value = 1
    search(query, 1)
    addToHistory(debouncedQuery.value, filters.value)
    searchHistoryVisible.value = false
  }
}

function loadMore() {
  const query = buildGitHubQuery()
  if (query && hasMore.value) {
    currentPage.value++
    search(query, currentPage.value, true)
  }
}

function clearFilters() {
  filters.value = {
    language: '', location: '', minFollowers: undefined, minRepos: undefined, organization: '', minPushed: '', username: '', openSourceContributors: false, topics: '', minStars: undefined, joinedSince: '', hasPortfolio: false, sort: 'followers', order: 'desc'
  }
  doSearch()
}

const isSearchSaved = computed(() =>
  savedSearchesStore.items.some(s => s.query === debouncedQuery.value.trim())
)

async function handleSaveSearch() {
  const query = debouncedQuery.value.trim()
  if (!query) return
  const activeFilters = { ...filters.value }
  const filterEntries = Object.entries(activeFilters).filter(([_, v]) => v !== '' && v !== undefined)
  if (filterEntries.length === 0) await savedSearchesStore.add(query)
  else await savedSearchesStore.add(query, activeFilters)
}

function applyHistoryItem(item: any) {
  searchQuery.value = item.query
  if (item.filters) filters.value = { ...item.filters }
  searchHistoryVisible.value = false
  doSearch()
}

function handleBlur() {
  window.setTimeout(() => {
    showSuggestions.value = false
    searchHistoryVisible.value = false
  }, 200)
}

watch(debouncedQuery, () => { doSearch() })
watch(filters, () => {
  if (debouncedQuery.value.trim()) doSearch()
}, { deep: true })
</script>

<template>
  <div class="space-y-12">
    <!-- Hero — editorial, not card -->
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-6">
        <div>
          <p class="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">Discover — GitHub talent</p>
          <h1 class="text-section text-white">Search developers</h1>
          <p class="mt-3 text-sm text-white/40 max-w-xl">Type a name, stack, or location. Use language pills or refine with filters. GitHub is the source of truth — we add the workspace.</p>
        </div>
        <button
          @click="showFilters = !showFilters"
          class="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-colors cursor-pointer"
          :class="showFilters ? 'bg-white text-black border-white' : 'text-white border-white/15 hover:bg-white/10 hover:border-white/20'"
        >
          <FunnelIcon class="w-4 h-4" />
          Filters
          <span v-if="hasActiveFilters" class="ml-1 w-5 h-5 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold">{{ Object.values(filters).filter(v => v !== '' && v !== undefined && v !== false).length }}</span>
          <span v-else-if="showFilters" class="ml-1"><XMarkIcon class="w-4 h-4" /></span>
        </button>
      </div>

      <!-- Search — premium large pill -->
      <div class="relative max-w-3xl">
        <MagnifyingGlassIcon class="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          @focus="searchHistoryVisible = history.length > 0 && searchQuery.trim().length > 0; showSuggestions = searchQuery.trim().length === 0"
          @blur="handleBlur"
          placeholder="Search GitHub users…"
          class="w-full pl-12 pr-14 py-4 bg-white/[0.06] border border-white/[0.08] rounded-full text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/15 text-[15px] transition-colors"
        />
        <button
          v-if="debouncedQuery.trim()"
          @click="handleSaveSearch"
          :disabled="isSearchSaved"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          :class="isSearchSaved ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white hover:text-black'"
          :title="isSearchSaved ? 'Already saved' : 'Save search'"
        >
          <BookmarkSolid v-if="isSearchSaved" class="w-4 h-4" />
          <BookmarkOutline v-else class="w-4 h-4" />
        </button>

        <!-- Suggestions — minimal pills, not nested dropdown noise -->
        <div v-if="showSuggestions && !searchHistoryVisible" class="absolute z-10 w-full mt-3 bg-[#0F172A] border border-white/10 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden p-4">
          <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/30 mb-3">Popular languages</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="lang in POPULAR_LANGUAGES"
              :key="lang"
              @click="filters.language = lang; doSearch(); showSuggestions = false"
              class="px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer"
              :class="filters.language === lang ? 'bg-white text-black border-white' : 'bg-white/[0.06] text-white/70 border-white/10 hover:bg-white/10 hover:text-white'"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <div v-if="searchHistoryVisible && history.length > 0" class="absolute z-10 w-full mt-3 bg-[#0F172A] border border-white/10 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden">
          <div class="p-2">
            <p class="px-3 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/30">Recent searches</p>
            <button
              v-for="item in history"
              :key="item.id"
              @click="applyHistoryItem(item)"
              class="w-full text-left px-3 py-2.5 hover:bg-white/[0.06] rounded-[var(--radius-md)] transition-colors flex items-center justify-between group cursor-pointer"
            >
              <span class="text-sm text-white/80 flex items-center gap-2"><ClockIcon class="w-3.5 h-3.5 text-white/30" />{{ item.query }}</span>
              <span @click.stop="removeFromHistory(item.id)" class="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-opacity cursor-pointer"><XMarkIcon class="w-3.5 h-3.5" /></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick language pills — editorial -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="lang in POPULAR_LANGUAGES.slice(0,6)"
          :key="lang"
          @click="filters.language = filters.language === lang ? '' : lang"
          class="px-4 py-1.5 text-xs font-medium rounded-full border transition-colors cursor-pointer"
          :class="filters.language === lang ? 'bg-white text-black border-white' : 'text-white/50 border-white/10 hover:text-white hover:border-white/20 hover:bg-white/[0.04]'"
        >
          {{ lang }}
        </button>
        <span class="text-white/20 mx-1">·</span>
        <button @click="showFilters = !showFilters" class="text-xs text-white/40 hover:text-white underline underline-offset-4 cursor-pointer">More filters</button>
      </div>
    </div>

    <!-- Filters — premium, restrained (not 13 fields at once) -->
    <div v-if="showFilters" class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] overflow-hidden">
      <div class="p-6 lg:p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Language</label>
            <input v-model="filters.language" placeholder="TypeScript, Python…" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Location</label>
            <input v-model="filters.location" placeholder="San Francisco" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Followers ≥</label>
            <input v-model.number="filters.minFollowers" type="number" placeholder="100" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20" />
          </div>
        </div>

        <div v-if="showAdvanced" class="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-white/10">
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Organization</label>
            <input v-model="filters.organization" placeholder="vercel, supabase" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Min repos</label>
            <input v-model.number="filters.minRepos" type="number" placeholder="10" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Active since</label>
            <select v-model="filters.minPushed" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white focus:outline-none">
              <option value="">Anytime</option>
              <option :value="weekAgo">Past week</option>
              <option :value="monthAgo">Past month</option>
              <option :value="threeMonthsAgo">Past 3 months</option>
              <option :value="yearAgo">Past year</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Topics (comma-separated)</label>
            <input v-model="filters.topics" placeholder="ai, agents" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">Username exact</label>
            <input v-model="filters.username" placeholder="torvalds" class="w-full px-4 py-2.5 bg-[#0B1120] border border-white/10 rounded-[var(--radius-md)] text-sm text-white placeholder-white/20" />
          </div>
          <div class="flex items-end pb-2">
            <label class="flex items-center gap-2 cursor-pointer text-sm text-white/70"><input v-model="filters.openSourceContributors" type="checkbox" class="rounded border-white/20 bg-[#0B1120] text-white" /> Open-source contributors</label>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button @click="showAdvanced = !showAdvanced" class="text-sm text-white/50 hover:text-white transition-colors cursor-pointer">{{ showAdvanced ? '− Less' : '+ More filters' }}</button>
          <button v-if="hasActiveFilters" @click="clearFilters" class="text-sm text-white/60 hover:text-white underline underline-offset-4 cursor-pointer">Clear all</button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4 py-6">
      <div v-for="n in 4" :key="n" class="flex items-center gap-6 p-6 rounded-[var(--radius-lg)] border border-white/[0.06] bg-white/[0.02] animate-pulse">
        <div class="w-20 h-20 rounded-full bg-white/10" />
        <div class="flex-1 space-y-3">
          <div class="h-4 w-1/4 bg-white/10 rounded" />
          <div class="h-3 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-16 rounded-[var(--radius-lg)] border border-red-500/20 bg-red-500/5">
      <p class="text-red-300 text-sm">{{ error }}</p>
    </div>

    <!-- Results — premium cards, image-dominant -->
    <div v-else-if="results.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs tracking-[0.12em] uppercase text-white/30">{{ totalCount.toLocaleString() }} developers</p>
        <span class="text-xs text-white/20">J / K to navigate · Enter to open</span>
      </div>
      <div
        v-for="(user, index) in results"
        :key="user.id"
        :ref="(el: any) => { if (el) resultRefs[index] = el as HTMLElement }"
        class="group flex items-center gap-6 rounded-[var(--radius-lg)] border transition-colors cursor-pointer"
        :class="[
          index === 0 ? 'p-8 bg-white text-black border-white' : 'p-6 bg-white/[0.04] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06]',
          selectedResultIndex === index && index !== 0 ? 'border-white bg-white/[0.08]' : '',
          selectedResultIndex === index && index === 0 ? 'ring-2 ring-black/10' : ''
        ]"
        @click="router.push(`/profile/${user.login}`)"
        @mouseenter="selectedResultIndex = index"
      >
        <img :src="user.avatar_url" :alt="user.login" class="rounded-full object-cover shrink-0 ring-1 ring-white/10" :class="index === 0 ? 'w-28 h-28 ring-black/10' : 'w-20 h-20'" loading="lazy" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold tracking-tight truncate" :class="index === 0 ? 'text-[22px] text-black' : 'text-[18px] text-white'">{{ user.login }}</p>
          <p v-if="user.bio" class="text-sm truncate mt-1 max-w-xl" :class="index === 0 ? 'text-black/60' : 'text-white/50'">{{ user.bio }}</p>
          <p class="text-xs mt-2" :class="index === 0 ? 'text-black/40' : 'text-white/30'">{{ user.public_repos ?? '—' }} repos · {{ user.followers ?? '—' }} followers</p>
        </div>
        <div class="hidden sm:flex items-center gap-2 shrink-0">
          <button
            @click.stop="compareStore.add(user.login)"
            :disabled="compareStore.isSelected(user.login) || compareStore.usernames.length >= 3"
            class="w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
            :class="index === 0
              ? (compareStore.isSelected(user.login) ? 'bg-black text-white border-black' : 'border-black/10 text-black/40 hover:text-black hover:border-black/20 hover:bg-black/5')
              : (compareStore.isSelected(user.login) ? 'bg-white text-black border-white' : 'border-white/15 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/10')"
            title="Add to compare"
          >
            <PlusCircleIcon class="w-4 h-4" />
          </button>
          <button
            @click.stop="shortlistStore.isShortlisted(user.login) ? shortlistStore.remove(user.login) : shortlistStore.add(user.login)"
            class="w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer"
            :class="index === 0
              ? (shortlistStore.isShortlisted(user.login) ? 'bg-black text-white border-black' : 'border-black/10 text-black/40 hover:text-black hover:border-black/20')
              : (shortlistStore.isShortlisted(user.login) ? 'bg-white text-black border-white' : 'border-white/15 text-white/40 hover:text-amber-300 hover:border-amber-300/30')"
          >
            <StarSolid v-if="shortlistStore.isShortlisted(user.login)" class="w-4 h-4" />
            <StarOutline v-else class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="results.length > 0 && hasMore" ref="sentinelRef" class="h-10 flex items-center justify-center py-8">
      <div v-if="loading" class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>

    <div v-else-if="debouncedQuery.trim() && !loading" class="text-center py-16">
      <p class="text-2xl font-semibold text-white tracking-tight">No results</p>
      <p class="text-sm text-white/40 mt-2">No developers found for "{{ debouncedQuery }}" — try a broader query or different filters.</p>
    </div>

    <div v-else class="text-center py-16 border border-dashed border-white/10 rounded-[var(--radius-lg)]">
      <p class="text-white/60 text-sm">Start typing to search GitHub developers</p>
      <p class="text-white/30 text-xs mt-1">Try "react", "rust", or a username</p>
    </div>

    <div v-if="compareStore.usernames.length > 0" class="fixed bottom-6 right-6 z-20">
      <router-link to="/compare" class="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-semibold shadow-xl hover:bg-white/90 transition-colors cursor-pointer">
        Compare ({{ compareStore.usernames.length }})
      </router-link>
    </div>
  </div>
</template>
