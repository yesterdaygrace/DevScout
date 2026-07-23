<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCollectionsStore } from '../stores/collections'
import { useRouter } from 'vue-router'
import {
  TrashIcon, UserGroupIcon, PencilIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon,
  MagnifyingGlassIcon, ArrowDownTrayIcon, FunnelIcon,
  FolderIcon, StarIcon, HeartIcon, FireIcon, BookmarkIcon, FlagIcon, GlobeAltIcon, SparklesIcon
} from '@heroicons/vue/24/outline'
import type { Collection } from '../stores/collections'

const COLLECTION_STYLES_KEY = 'collection_styles'

interface CollectionStyle {
  color: string
  icon: string
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
]
const COLOR_NAMES: Record<string, string> = {
  '#ef4444': 'Red', '#f97316': 'Orange', '#f59e0b': 'Amber', '#84cc16': 'Lime', '#10b981': 'Emerald',
  '#06b6d4': 'Cyan', '#6366f1': 'Indigo', '#8b5cf6': 'Purple', '#a855f7': 'Pink', '#ec4899': 'Rose',
}
const ICON_MAP: Record<string, any> = {
  'Folder': FolderIcon, 'Star': StarIcon, 'Heart': HeartIcon, 'Fire': FireIcon,
  'Bookmark': BookmarkIcon, 'Flag': FlagIcon, 'Globe': GlobeAltIcon, 'Sparkles': SparklesIcon,
}
const ICON_NAMES = Object.keys(ICON_MAP)

const collectionsStore = useCollectionsStore()
const router = useRouter()

const newCollectionName = ref('')
const expandedCollectionId = ref<string | null>(null)
const editingCollectionId = ref<string | null>(null)
const editingName = ref('')
const searchQuery = ref('')
const sortBy = ref<'name' | 'members' | 'created'>('created')
const sortOrder = ref<'asc' | 'desc'>('desc')
const showColorPicker = ref<string | null>(null)
const showIconPicker = ref<string | null>(null)

function loadCollectionStyles(): Record<string, CollectionStyle> {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_STYLES_KEY) || '{}')
  } catch { return {} }
}

function saveCollectionStyle(id: string, style: Partial<CollectionStyle>) {
  const all = loadCollectionStyles()
  all[id] = { ...all[id] || { color: PRESET_COLORS[5], icon: 'Folder' }, ...style }
  localStorage.setItem(COLLECTION_STYLES_KEY, JSON.stringify(all))
}

function getCollectionStyle(id: string): CollectionStyle {
  const all = loadCollectionStyles()
  return all[id] || { color: PRESET_COLORS[5], icon: 'Folder' }
}

const filteredAndSortedCollections = computed(() => {
  let list = [...collectionsStore.collections]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }

  list.sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy.value === 'members') cmp = (a.members?.length || 0) - (b.members?.length || 0)
    else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return sortOrder.value === 'desc' ? -cmp : cmp
  })

  return list
})

function getIconComponent(iconName: string): any {
  return ICON_MAP[iconName] || FolderIcon
}

onMounted(async () => {
  await collectionsStore.fetch()
})

async function handleCreateCollection() {
  if (!newCollectionName.value.trim()) return
  await collectionsStore.create(newCollectionName.value.trim())
  newCollectionName.value = ''
}

function toggleExpanded(collectionId: string) {
  expandedCollectionId.value = expandedCollectionId.value === collectionId ? null : collectionId
}

function startEditing(collection: Collection) {
  editingCollectionId.value = collection.id
  editingName.value = collection.name
}

function cancelEditing() {
  editingCollectionId.value = null
  editingName.value = ''
}

async function saveEditing(collectionId: string) {
  if (!editingName.value.trim()) { cancelEditing(); return }
  await collectionsStore.rename(collectionId, editingName.value.trim())
  editingCollectionId.value = null
  editingName.value = ''
}

async function handleDuplicateCollection(collectionId: string) {
  await collectionsStore.duplicate(collectionId)
}

async function handleRemoveCollection(collectionId: string) {
  if (confirm('Delete this collection? All members will be removed.')) {
    await collectionsStore.remove(collectionId)
  }
}

function handleExportJSON() {
  const data = collectionsStore.collections.map(c => ({
    name: c.name,
    members: c.members?.map(m => m.github_username) || [],
    created: c.created_at,
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `collections-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleExportCSV() {
  const headers = ['Collection Name', 'Members', 'Created']
  const rows = collectionsStore.collections.map(c => [
    c.name,
    (c.members?.map(m => m.github_username) || []).join('; '),
    c.created_at,
  ])
  const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `collections-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const showExportMenu = ref(false)

function handleExportBlur() {
  setTimeout(() => { showExportMenu.value = false }, 200)
}

async function handleRemoveMember(collectionId: string, githubUsername: string) {
  await collectionsStore.removeMember(collectionId, githubUsername)
}

function getMemberCount(collection: Collection): number {
  return collection.members?.length || 0
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Candidate Collections</h1>
      <div v-if="collectionsStore.collections.length > 0" class="flex gap-2 relative">
        <button
          @click="showExportMenu = !showExportMenu"
          @blur="handleExportBlur"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Export collections"
        >
          <ArrowDownTrayIcon class="w-4 h-4" />
          Export
        </button>
        <div v-if="showExportMenu" class="absolute right-0 top-full mt-1 z-20 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button @click="handleExportJSON(); showExportMenu = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as JSON</button>
          <button @click="handleExportCSV(); showExportMenu = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Export as CSV</button>
        </div>
      </div>
    </div>

    <section>
      <!-- Create & Search -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <div class="flex gap-2 flex-1">
          <input
            v-model="newCollectionName"
            @keyup.enter="handleCreateCollection"
            type="text"
            placeholder="New collection name..."
            class="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            @click="handleCreateCollection"
            :disabled="!newCollectionName.trim()"
            class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
        <div class="relative flex-1">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search collections..."
            class="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <!-- Sort controls -->
      <div class="flex items-center gap-2 mb-4 text-sm">
        <FunnelIcon class="w-4 h-4 text-gray-400" />
        <span class="text-gray-500">Sort by:</span>
        <select
          v-model="sortBy"
          class="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="created">Created</option>
          <option value="name">Name</option>
          <option value="members">Members</option>
        </select>
        <button
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          class="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="collectionsStore.loading" class="space-y-3">
        <div v-for="n in 3" :key="n" class="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" aria-hidden="true" />
      </div>

      <!-- Empty states -->
      <div v-else-if="collectionsStore.collections.length === 0" class="text-center py-12 text-gray-400">
        <UserGroupIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p class="text-lg">No collections yet. Create your first collection to organize candidates.</p>
      </div>

      <div v-else-if="filteredAndSortedCollections.length === 0" class="text-center py-12 text-gray-400">
        <p>No collections match "{{ searchQuery }}"</p>
      </div>

      <!-- Collection list -->
      <div v-else class="grid gap-4">
        <div
          v-for="collection in filteredAndSortedCollections"
          :key="collection.id"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div class="p-4" :style="{ borderLeft: `4px solid ${getCollectionStyle(collection.id).color}` }">
            <div class="flex items-center justify-between mb-2">
              <div v-if="editingCollectionId === collection.id" class="flex items-center gap-2 flex-1">
                <input
                  v-model="editingName"
                  @keyup.enter="saveEditing(collection.id)"
                  @keyup.esc="cancelEditing"
                  type="text"
                  class="flex-1 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autofocus
                />
                <button @click="saveEditing(collection.id)" class="text-green-500 hover:text-green-600" aria-label="Save">
                  <CheckIcon class="w-5 h-5" />
                </button>
                <button @click="cancelEditing" class="text-gray-400 hover:text-gray-600" aria-label="Cancel">
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2 flex-1">
                <!-- Icon -->
                <component :is="getIconComponent(getCollectionStyle(collection.id).icon)" class="w-5 h-5 shrink-0" :style="{ color: getCollectionStyle(collection.id).color }" />
                <button @click="toggleExpanded(collection.id)" class="text-lg font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {{ collection.name }}
                </button>
                <button @click="startEditing(collection)" class="text-gray-400 hover:text-gray-600" aria-label="Edit name">
                  <PencilIcon class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center gap-1">
                <!-- Icon picker -->
                <div class="relative">
                  <button
                    @click="showIconPicker = showIconPicker === collection.id ? null : collection.id; showColorPicker = null"
                    class="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    aria-label="Pick icon"
                  >
                    <component :is="getIconComponent(getCollectionStyle(collection.id).icon)" class="w-4 h-4" />
                  </button>
                  <div v-if="showIconPicker === collection.id" class="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                    <div class="grid grid-cols-4 gap-1">
                      <button
                        v-for="name in ICON_NAMES" :key="name"
                        @click="saveCollectionStyle(collection.id, { icon: name }); showIconPicker = null"
                        class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        :title="name"
                      >
                        <component :is="getIconComponent(name)" class="w-5 h-5 mx-auto" :class="getCollectionStyle(collection.id).icon === name ? 'text-indigo-500' : 'text-gray-500'" />
                      </button>
                    </div>
                  </div>
                </div>
                <!-- Color picker -->
                <div class="relative">
                  <button
                    @click="showColorPicker = showColorPicker === collection.id ? null : collection.id; showIconPicker = null"
                    class="w-5 h-5 rounded-full border-2 border-white dark:border-gray-600 shadow-sm"
                    :style="{ backgroundColor: getCollectionStyle(collection.id).color }"
                    aria-label="Pick color"
                  />
                  <div v-if="showColorPicker === collection.id" class="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                    <div class="grid grid-cols-5 gap-1.5">
                      <button
                        v-for="color in PRESET_COLORS" :key="color"
                        @click="saveCollectionStyle(collection.id, { color }); showColorPicker = null"
                        class="w-7 h-7 rounded-full border-2 border-white dark:border-gray-600 shadow-sm hover:scale-110 transition-transform"
                        :style="{ backgroundColor: color }"
                        :title="COLOR_NAMES[color] || color"
                      />
                    </div>
                  </div>
                </div>
                <button @click="handleDuplicateCollection(collection.id)" class="text-gray-400 hover:text-indigo-500 p-1" aria-label="Duplicate collection" title="Duplicate">
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>
                <button @click="handleRemoveCollection(collection.id)" class="text-red-400 hover:text-red-600 p-1" aria-label="Delete collection">
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ getMemberCount(collection) }} member{{ getMemberCount(collection) !== 1 ? 's' : '' }}</span>
              <button @click="toggleExpanded(collection.id)" class="text-indigo-500 hover:underline">
                {{ expandedCollectionId === collection.id ? 'Hide' : 'View' }} members
              </button>
            </div>

            <div v-if="expandedCollectionId === collection.id" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div v-if="getMemberCount(collection) === 0" class="text-sm text-gray-400">No members yet.</div>
              <div v-else class="space-y-2">
                <div
                  v-for="member in collection.members"
                  :key="member.id"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                >
                  <button
                    @click="router.push(`/profile/${member.github_username}`)"
                    class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {{ member.github_username }}
                  </button>
                  <button
                    @click="handleRemoveMember(collection.id, member.github_username)"
                    class="text-red-400 hover:text-red-600"
                    aria-label="Remove member"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
