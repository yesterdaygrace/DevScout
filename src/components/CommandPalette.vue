<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  HomeIcon, MagnifyingGlassIcon, FolderIcon, ArrowsRightLeftIcon,
  DocumentTextIcon, BookmarkIcon, UserCircleIcon, KeyIcon, SunIcon,
} from '@heroicons/vue/24/outline'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: any
  action: () => void
}

const router = useRouter()
const isOpen = ref(false)
const query = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const commands = computed<CommandItem[]>(() => [
  { id: 'dashboard', label: 'Dashboard', description: 'Go to dashboard', icon: HomeIcon, action: () => router.push('/') },
  { id: 'search', label: 'Search Developers', description: 'Search GitHub developers', icon: MagnifyingGlassIcon, action: () => router.push('/search') },
  { id: 'collections', label: 'Collections', description: 'Manage candidate collections', icon: FolderIcon, action: () => router.push('/collections') },
  { id: 'compare', label: 'Compare', description: 'Compare developers side-by-side', icon: ArrowsRightLeftIcon, action: () => router.push('/compare') },
  { id: 'notes', label: 'Notes', description: 'View and manage notes', icon: DocumentTextIcon, action: () => router.push('/notes-search') },
  { id: 'saved-searches', label: 'Saved Searches', description: 'View saved searches', icon: BookmarkIcon, action: () => router.push('/searches') },
  { id: 'settings-profile', label: 'Settings: Profile', description: 'Edit your profile settings', icon: UserCircleIcon, action: () => router.push('/settings/profile') },
  { id: 'settings-api', label: 'Settings: API', description: 'Manage API keys', icon: KeyIcon, action: () => router.push('/settings/api') },
  { id: 'settings-appearance', label: 'Settings: Appearance', description: 'Toggle dark/light mode', icon: SunIcon, action: () => router.push('/settings/appearance') },
])

const filteredCommands = computed(() => {
  if (!query.value.trim()) return commands.value
  const q = query.value.toLowerCase()
  return commands.value.filter(
    c => c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
})

function openPalette() {
  isOpen.value = true
  query.value = ''
  selectedIndex.value = 0
  setTimeout(() => inputRef.value?.focus(), 50)
}

function closePalette() {
  isOpen.value = false
  query.value = ''
}

function executeSelected() {
  const items = filteredCommands.value
  if (items[selectedIndex.value]) {
    items[selectedIndex.value].action()
    closePalette()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    if (isOpen.value) closePalette()
    else openPalette()
    return
  }
  if (!isOpen.value) return

  if (e.key === 'Escape') {
    closePalette()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    executeSelected()
    return
  }
}

watch(query, () => {
  selectedIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ openPalette })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" @click.self="closePalette">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50" aria-hidden="true" />

        <!-- Palette -->
        <div class="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Search Input -->
          <div class="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
            <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref="inputRef"
              v-model="query"
              placeholder="Search commands..."
              class="w-full py-3.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
            />
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded shrink-0">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-72 overflow-y-auto p-2">
            <div v-if="filteredCommands.length === 0" class="px-3 py-8 text-center text-sm text-gray-400">
              No results for "{{ query }}"
            </div>
            <button
              v-for="(cmd, idx) in filteredCommands"
              :key="cmd.id"
              @click="cmd.action(); closePalette()"
              @mouseenter="selectedIndex = idx"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
              :class="idx === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <component :is="cmd.icon" class="w-5 h-5 shrink-0" :class="idx === selectedIndex ? 'text-indigo-500' : 'text-gray-400'" />
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ cmd.label }}</p>
                <p class="text-xs text-gray-400 truncate">{{ cmd.description }}</p>
              </div>
              <kbd v-if="idx === selectedIndex" class="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
                ↵
              </kbd>
            </button>
          </div>

          <!-- Footer hint -->
          <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navigate</span>
            <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> Open</span>
            <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
