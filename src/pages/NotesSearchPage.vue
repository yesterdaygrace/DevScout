<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { marked } from 'marked'
import { MagnifyingGlassIcon, XMarkIcon, TagIcon, TrashIcon, BookmarkIcon } from '@heroicons/vue/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/vue/24/solid'

const PINS_KEY = 'notes_pinned'

const notesStore = useNotesStore()
const router = useRouter()

const pinnedUsernames = ref<string[]>([])

function loadPins() {
  try { pinnedUsernames.value = JSON.parse(localStorage.getItem(PINS_KEY) || '[]') } catch { pinnedUsernames.value = [] }
}

function savePins() {
  localStorage.setItem(PINS_KEY, JSON.stringify(pinnedUsernames.value))
}

function togglePin(username: string) {
  const idx = pinnedUsernames.value.indexOf(username)
  if (idx >= 0) pinnedUsernames.value.splice(idx, 1)
  else pinnedUsernames.value.push(username)
  savePins()
}

function isPinned(username: string): boolean {
  return pinnedUsernames.value.includes(username)
}

const sortedNotes = computed(() => {
  const pinned = notesStore.filteredNotes.filter(n => isPinned(n.github_username))
  const unpinned = notesStore.filteredNotes.filter(n => !isPinned(n.github_username))
  return [...pinned, ...unpinned]
})

onMounted(async () => {
  await notesStore.fetch()
  loadPins()
})

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function selectTag(tag: string) {
  if (notesStore.activeTagFilter === tag) {
    notesStore.setTagFilter(null)
  } else {
    notesStore.setTagFilter(tag)
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Notes</h1>

    <!-- Search Input -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        v-model="notesStore.searchQuery"
        placeholder="Search notes by username, content, or tags..."
        class="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        v-if="notesStore.searchQuery"
        @click="notesStore.setSearchQuery('')"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Tag Filter -->
    <div v-if="notesStore.allTags.length > 0" class="flex flex-wrap items-center gap-2">
      <TagIcon class="w-4 h-4 text-gray-400" />
      <button
        v-for="tag in notesStore.allTags"
        :key="tag"
        @click="selectTag(tag)"
        class="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
        :class="notesStore.activeTagFilter === tag
          ? 'bg-indigo-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
      >
        {{ tag }}
      </button>
      <button
        v-if="notesStore.activeTagFilter"
        @click="notesStore.setTagFilter(null)"
        class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1"
      >
        Clear
      </button>
    </div>

    <!-- Results -->
    <div v-if="sortedNotes.length > 0" class="space-y-3">
      <p class="text-sm text-gray-500">{{ sortedNotes.length }} note{{ sortedNotes.length !== 1 ? 's' : '' }}{{ pinnedUsernames.length > 0 ? ` · ${pinnedUsernames.length} pinned` : '' }}</p>
      <div
        v-for="note in sortedNotes"
        :key="note.id"
        class="p-4 bg-white dark:bg-gray-800 rounded-lg border transition-shadow"
        :class="isPinned(note.github_username)
          ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:shadow-md'"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <button @click="togglePin(note.github_username)" class="text-gray-400 hover:text-indigo-500 transition-colors" :title="isPinned(note.github_username) ? 'Unpin' : 'Pin note'">
              <BookmarkSolid v-if="isPinned(note.github_username)" class="w-4 h-4 text-indigo-500" />
              <BookmarkIcon v-else class="w-4 h-4" />
            </button>
            <button
              @click="router.push(`/profile/${note.github_username}`)"
              class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {{ note.github_username }}
            </button>
          </div>
          <button
            @click="notesStore.remove(note.github_username)"
            class="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete note"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 line-clamp-4" v-html="marked.parse(note.content)" />
        <div v-if="note.tags && note.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
          <span
            v-for="tag in note.tags"
            :key="tag"
            class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs"
          >
            {{ tag }}
          </span>
        </div>
        <p class="text-xs text-gray-400 mt-2">
          Edited {{ timeAgo(note.updated_at) }}
          &bull; {{ note.content.length }} chars &bull; {{ wordCount(note.content) }} words
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="notesStore.notes.length > 0" class="text-center py-12 text-gray-400">
      No notes match your search.
    </div>

    <div v-else-if="notesStore.loading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" aria-hidden="true" />
    </div>

    <div v-else class="text-center py-12 text-gray-400">
      <p>No notes yet. Visit a developer profile to add notes.</p>
      <router-link to="/search" class="text-indigo-500 hover:underline mt-2 inline-block">Search developers</router-link>
    </div>
  </div>
</template>
