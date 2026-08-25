<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSavedSearchesStore } from '../stores/savedSearches'
import { MagnifyingGlassIcon, TrashIcon, FunnelIcon, StarIcon, DocumentDuplicateIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'

const FAVORITES_KEY = 'saved_searches_favorites'
const USAGE_KEY = 'saved_searches_usage'

interface UsageData {
  lastUsed: string
  count: number
}

const savedSearchesStore = useSavedSearchesStore()
const router = useRouter()

const editingId = ref<string | null>(null)
const editingQuery = ref('')

const favorites = ref<string[]>([])
const usage = ref<Record<string, UsageData>>({})

function loadFavorites() {
  try { favorites.value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { favorites.value = [] }
}
function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
}
function toggleFavorite(id: string) {
  const idx = favorites.value.indexOf(id)
  if (idx >= 0) favorites.value.splice(idx, 1)
  else favorites.value.push(id)
  saveFavorites()
}
function isFavorite(id: string): boolean {
  return favorites.value.includes(id)
}

function loadUsage() {
  try { usage.value = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}') } catch { usage.value = {} }
}
function saveUsage() {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage.value))
}
function trackUsage(id: string) {
  const u = usage.value[id] || { lastUsed: '', count: 0 }
  u.lastUsed = new Date().toISOString()
  u.count++
  usage.value[id] = u
  saveUsage()
}
function getUsage(id: string): UsageData {
  return usage.value[id] || { lastUsed: '', count: 0 }
}

const sortedItems = computed(() => {
  const items = [...savedSearchesStore.items]
  items.sort((a, b) => {
    const aFav = isFavorite(a.id)
    const bFav = isFavorite(b.id)
    if (aFav && !bFav) return -1
    if (!aFav && bFav) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
  return items
})

onMounted(async () => {
  await savedSearchesStore.fetch()
  loadFavorites()
  loadUsage()
})

function handleSearchClick(item: any) {
  const params = new URLSearchParams()
  params.set('q', item.query)
  if (item.filters) {
    if (item.filters.language) params.set('language', item.filters.language)
    if (item.filters.location) params.set('location', item.filters.location)
    if (item.filters.minFollowers !== undefined) params.set('minFollowers', String(item.filters.minFollowers))
    if (item.filters.minRepos !== undefined) params.set('minRepos', String(item.filters.minRepos))
    if (item.filters.sort) params.set('sort', item.filters.sort)
    if (item.filters.order) params.set('order', item.filters.order)
  }
  trackUsage(item.id)
  router.push(`/search?${params.toString()}`)
}

function handleDelete(id: string) {
  savedSearchesStore.remove(id)
}

function startEdit(item: any) {
  editingId.value = item.id
  editingQuery.value = item.query
}

function cancelEdit() {
  editingId.value = null
  editingQuery.value = ''
}

async function saveEdit(id: string) {
  if (!editingQuery.value.trim()) { cancelEdit(); return }
  const item = savedSearchesStore.items.find(i => i.id === id)
  await savedSearchesStore.remove(id)
  await savedSearchesStore.add(editingQuery.value.trim(), item?.filters)
  editingId.value = null
  editingQuery.value = ''
}

async function handleDuplicate(item: any) {
  const newQuery = `${item.query} (copy)`
  await savedSearchesStore.add(newQuery, item.filters)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getFilterBadges(filters: any): string[] {
  if (!filters) return []
  const badges: string[] = []
  if (filters.language) badges.push(`Language: ${filters.language}`)
  if (filters.location) badges.push(`Location: ${filters.location}`)
  if (filters.minFollowers !== undefined) badges.push(`Followers ≥ ${filters.minFollowers}`)
  if (filters.minRepos !== undefined) badges.push(`Repos ≥ ${filters.minRepos}`)
  return badges
}

function formatUsageTime(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Saved Searches
      </h1>
    </div>

    <div v-if="savedSearchesStore.loading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>

    <div v-else-if="savedSearchesStore.items.length === 0" class="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
      <MagnifyingGlassIcon class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p class="text-gray-500 dark:text-gray-400 mb-2">No saved searches yet</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">
        Save your frequent searches to access them quickly. 
        <router-link to="/search" class="text-indigo-500 hover:underline">Go to search</router-link>
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        class="bg-white dark:bg-gray-800 rounded-lg p-5 border transition-colors group"
        :class="isFavorite(item.id)
          ? 'border-yellow-300 dark:border-yellow-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Editing -->
            <div v-if="editingId === item.id" class="flex items-center gap-2 mb-2">
              <input
                v-model="editingQuery"
                @keyup.enter="saveEdit(item.id)"
                @keyup.esc="cancelEdit"
                class="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autofocus
              />
              <button @click="saveEdit(item.id)" class="text-green-500 hover:text-green-600"><CheckIcon class="w-5 h-5" /></button>
              <button @click="cancelEdit" class="text-gray-400 hover:text-gray-600"><XMarkIcon class="w-5 h-5" /></button>
            </div>

            <!-- Display -->
            <div v-else>
              <div class="flex items-center gap-2 mb-1">
                <button @click="toggleFavorite(item.id)" :title="isFavorite(item.id) ? 'Remove favorite' : 'Add to favorites'">
                  <StarSolid v-if="isFavorite(item.id)" class="w-4 h-4 text-yellow-500" />
                  <StarIcon v-else class="w-4 h-4 text-gray-400 hover:text-yellow-500" />
                </button>
                <button @click="handleSearchClick(item)" class="flex items-center gap-2 flex-1 min-w-0">
                  <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 shrink-0" />
                  <span class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{{ item.query }}</span>
                </button>
              </div>
              <div v-if="getFilterBadges(item.filters).length > 0" class="flex flex-wrap gap-2 mb-2 ml-7">
                <span v-for="badge in getFilterBadges(item.filters)" :key="badge" class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                  <FunnelIcon class="w-3 h-3" /> {{ badge }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 ml-7">
                <span>Saved {{ formatDate(item.created_at) }}</span>
                <span v-if="getUsage(item.id).count > 0">
                  Used {{ getUsage(item.id).count }} time{{ getUsage(item.id).count !== 1 ? 's' : '' }}
                  <span v-if="getUsage(item.id).lastUsed">· last {{ formatUsageTime(getUsage(item.id).lastUsed) }}</span>
                </span>
                <span v-else>Not used yet</span>
                <span v-if="getUsage(item.id).count >= 3" class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium">Frequent</span>
              </div>
            </div>
          </div>

          <div v-if="editingId !== item.id" class="flex items-center gap-1 shrink-0">
            <button @click="startEdit(item)" class="p-2 text-gray-400 hover:text-gray-600 rounded" title="Rename"><PencilIcon class="w-4 h-4" /></button>
            <button @click="handleDuplicate(item)" class="p-2 text-gray-400 hover:text-indigo-500 rounded" title="Duplicate"><DocumentDuplicateIcon class="w-4 h-4" /></button>
            <button @click="handleDelete(item.id)" class="p-2 text-gray-400 hover:text-red-600 rounded" title="Delete"><TrashIcon class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
