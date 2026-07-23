<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGitHubSearch } from '../composables/useGitHubApi'
import { useDebounce } from '../composables/useDebounce'
import { useShortlistStore } from '../stores/shortlist'
import { useCompareStore } from '../stores/compare'
import { useSavedSearchesStore } from '../stores/savedSearches'
import { useSearchHistory } from '../composables/useSearchHistory'
import { MagnifyingGlassIcon, StarIcon as StarOutline, PlusCircleIcon, FunnelIcon, XMarkIcon, ClockIcon, BookmarkIcon as BookmarkOutline, CodeBracketIcon } from '@heroicons/vue/24/outline'
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
  // / to focus search (when not already in an input)
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
    e.preventDefault()
    searchInputRef.value?.focus()
    return
  }

  // Only handle J/K when results are showing and not in an input
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
  
  // Parse URL query params from saved searches navigation
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
    // Trigger search explicitly after setting query + filters
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
  
  if (filters.value.username) {
    parts.push(`user:${filters.value.username}`)
  }
  
  if (textQuery) {
    parts.push(textQuery)
  }
  
  if (!parts.length) return ''
  
  if (filters.value.language) {
    parts.push(`language:${filters.value.language}`)
  }
  
  if (filters.value.location) {
    parts.push(`location:"${filters.value.location}"`)
  }
  
  if (filters.value.minFollowers !== undefined && filters.value.minFollowers > 0) {
    parts.push(`followers:>=${filters.value.minFollowers}`)
  }
  
  if (filters.value.minRepos !== undefined && filters.value.minRepos > 0) {
    parts.push(`repos:>=${filters.value.minRepos}`)
  }
  
  if (filters.value.organization) {
    parts.push(`org:${filters.value.organization}`)
  }
  
  if (filters.value.minPushed) {
    parts.push(`pushed:>${filters.value.minPushed}`)
  }
  
  if (filters.value.openSourceContributors) {
    parts.push(`good-first-issues:>0`)
  }
  
  if (filters.value.topics) {
    const topics = filters.value.topics.split(',').map(t => t.trim()).filter(Boolean)
    for (const topic of topics) {
      parts.push(`topic:${topic}`)
    }
  }
  
  if (filters.value.minStars !== undefined && filters.value.minStars > 0) {
    parts.push(`stars:>=${filters.value.minStars}`)
  }
  
  if (filters.value.joinedSince) {
    parts.push(`created:>${filters.value.joinedSince}`)
  }
  
  if (filters.value.hasPortfolio) {
    parts.push(`has:portfolio`)
  }
  
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
  // Only save non-empty filters
  const filterEntries = Object.entries(activeFilters).filter(([_, v]) => v !== '' && v !== undefined)
  if (filterEntries.length === 0) {
    await savedSearchesStore.add(query)
  } else {
    await savedSearchesStore.add(query, activeFilters)
  }
}

function applyHistoryItem(item: any) {
  searchQuery.value = item.query
  if (item.filters) {
    filters.value = { ...item.filters }
  }
  searchHistoryVisible.value = false
  doSearch()
}

function handleBlur() {
  window.setTimeout(() => {
    showSuggestions.value = false
    searchHistoryVisible.value = false
  }, 200)
}

watch(debouncedQuery, () => {
  doSearch()
})

watch(filters, () => {
  if (debouncedQuery.value.trim()) {
    doSearch()
  }
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Search Developers</h1>
      <button
        @click="showFilters = !showFilters"
        class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <FunnelIcon class="w-5 h-5" />
        Filters
          <span v-if="hasActiveFilters" class="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
            {{ Object.values(filters).filter(v => v !== '' && v !== undefined && v !== false).length }}
          </span>
      </button>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        @focus="searchHistoryVisible = history.length > 0 && searchQuery.trim().length > 0; showSuggestions = searchQuery.trim().length === 0"
        @blur="handleBlur"
        placeholder="Search GitHub users... (press / to focus)"
        class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      
      <!-- Save Search Button -->
      <button
        v-if="debouncedQuery.trim()"
        @click="handleSaveSearch"
        :disabled="isSearchSaved"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors"
        :class="isSearchSaved ? 'text-indigo-500 cursor-default' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'"
        :title="isSearchSaved ? 'Search already saved' : 'Save this search'"
      >
        <BookmarkSolid v-if="isSearchSaved" class="w-5 h-5" />
        <BookmarkOutline v-else class="w-5 h-5" />
      </button>
      
      <!-- Search Suggestions Dropdown -->
      <div v-if="showSuggestions && !searchHistoryVisible" class="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <!-- Popular Languages -->
        <div class="p-2">
          <div class="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            <CodeBracketIcon class="w-3 h-3" />
            Popular languages
          </div>
          <div class="flex flex-wrap gap-1.5 mt-1 px-2">
            <button
              v-for="lang in POPULAR_LANGUAGES"
              :key="lang"
              @click="filters.language = lang; doSearch(); showSuggestions = false"
              class="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {{ lang }}
            </button>
          </div>
        </div>
      </div>

      <!-- Search History Dropdown -->
      <div v-if="searchHistoryVisible && history.length > 0" class="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
        <div class="p-2">
          <div class="flex items-center justify-between px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <ClockIcon class="w-3 h-3" />
              Recent searches
            </span>
          </div>
          <button
            v-for="item in history"
            :key="item.id"
            @click="applyHistoryItem(item)"
            class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-between group"
          >
            <span class="text-sm">{{ item.query }}</span>
            <button
              @click.stop="removeFromHistory(item.id)"
              class="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </button>
        </div>
      </div>
    </div>

    <!-- Filters Panel -->
      <div v-if="showFilters" class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Username</label>
            <input
              v-model="filters.username"
              placeholder="e.g. torvalds"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Language</label>
            <input
              v-model="filters.language"
              placeholder="e.g. JavaScript, Python"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Location</label>
            <input
              v-model="filters.location"
              placeholder="e.g. San Francisco"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Organization</label>
            <input
              v-model="filters.organization"
              placeholder="e.g. microsoft, google"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Recently Active</label>
            <select
              v-model="filters.minPushed"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Anytime</option>
              <option :value="weekAgo">Past week</option>
              <option :value="monthAgo">Past month</option>
              <option :value="threeMonthsAgo">Past 3 months</option>
              <option :value="yearAgo">Past year</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Min Followers</label>
            <input
              v-model.number="filters.minFollowers"
              type="number"
              min="0"
              placeholder="e.g. 100"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Min Repos</label>
            <input
              v-model.number="filters.minRepos"
              type="number"
              min="0"
              placeholder="e.g. 10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="filters.openSourceContributors"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium">Open Source Contributors</span>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Topics</label>
            <input
              v-model="filters.topics"
              placeholder="e.g. machine-learning, react"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
            <p class="text-xs text-gray-400 mt-0.5">Comma-separated list</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Min Stars</label>
            <input
              v-model.number="filters.minStars"
              type="number"
              min="0"
              placeholder="e.g. 500"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Joined Since</label>
            <input
              v-model="filters.joinedSince"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="filters.hasPortfolio"
                type="checkbox"
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500"
              />
              <span class="text-sm font-medium">Has Portfolio Website</span>
            </label>
          </div>
        </div>
        <div class="flex justify-end">
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      <div class="animate-pulse space-y-3">
        <div v-for="n in 5" :key="n" class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" aria-hidden="true" />
          <div class="flex-1 space-y-2 text-left">
            <div class="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
            <div class="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <!-- Results -->
    <div v-else-if="results.length > 0" class="space-y-3">
      <p class="text-sm text-gray-500">{{ totalCount.toLocaleString() }} results found</p>
      <div
        v-for="(user, index) in results"
        :key="user.id"
        :ref="(el: any) => { if (el) resultRefs[index] = el as HTMLElement }"
        class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border transition-shadow cursor-pointer"
        :class="selectedResultIndex === index ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:shadow-md'"
        @click="router.push(`/profile/${user.login}`)"
        @mouseenter="selectedResultIndex = index"
      >
        <img
          :src="user.avatar_url"
          :alt="user.login"
          class="w-12 h-12 rounded-full"
          loading="lazy"
        />
        <div class="flex-1 min-w-0">
          <button
            @click="router.push(`/profile/${user.login}`)"
            class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
          >
            {{ user.login }}
          </button>
          <p v-if="user.bio" class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ user.bio }}</p>
          <p class="text-xs text-gray-400">
            {{ user.public_repos }} repos · {{ user.followers }} followers
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="compareStore.add(user.login)"
            :disabled="compareStore.isSelected(user.login) || compareStore.usernames.length >= 3"
            class="p-2 text-gray-400 hover:text-indigo-500 disabled:opacity-30"
            :title="compareStore.isSelected(user.login) ? 'Already in compare' : 'Add to compare'"
          >
            <PlusCircleIcon class="w-5 h-5" />
          </button>
          <button
            @click="shortlistStore.isShortlisted(user.login) ? shortlistStore.remove(user.login) : shortlistStore.add(user.login)"
            class="p-2"
            :class="shortlistStore.isShortlisted(user.login) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
          >
            <StarSolid v-if="shortlistStore.isShortlisted(user.login)" class="w-5 h-5" />
            <StarOutline v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Infinite Scroll Sentinel -->
    <div v-if="results.length > 0 && hasMore" ref="sentinelRef" class="h-10 flex items-center justify-center">
      <svg v-if="loading" class="animate-spin w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Empty State -->
    <div v-else-if="debouncedQuery.trim() && !loading" class="text-center py-12 text-gray-400">
      No results found for "{{ debouncedQuery }}"
    </div>

    <div v-else class="text-center py-12 text-gray-400">
      Start typing to search GitHub developers
    </div>

    <!-- Compare Floating Button -->
    <div v-if="compareStore.usernames.length > 0" class="fixed bottom-4 right-4">
      <router-link
        to="/compare"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        Compare ({{ compareStore.usernames.length }})
      </router-link>
    </div>
  </div>
</template>
