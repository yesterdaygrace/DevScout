<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { useRateLimit } from '../composables/useRateLimit'
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  FolderIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const ui = useUiStore()
const rateLimit = useRateLimit()
const route = useRoute()
const router = useRouter()
const showThemeMenu = ref(false)

// Header search
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

function handleHeaderSearch() {
  const q = searchQuery.value.trim()
  if (q) {
    router.push(`/search?q=${encodeURIComponent(q)}`)
    searchQuery.value = ''
  }
}

function handleHeaderKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => document.addEventListener('keydown', handleHeaderKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleHeaderKeydown))
const sidebarOpen = ref(false)
const expandedGroups = ref<Record<string, boolean>>({
  discover: true,
  candidates: true,
  settings: false,
})

function closeMenuSoon() {
  window.setTimeout(() => { showThemeMenu.value = false }, 200)
}

function toggleGroup(name: string) {
  expandedGroups.value[name] = !expandedGroups.value[name]
}

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

function activeBg(color: string): string {
  const map: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    sky: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    rose: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    slate: 'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
  }
  return map[color] || map.indigo
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 lg:relative lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <router-link to="/" class="text-lg font-bold bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500 bg-clip-text text-transparent" @click="sidebarOpen = false">
          DevScout
        </router-link>
        <button
          @click="sidebarOpen = false"
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 lg:hidden"
          aria-label="Close sidebar"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        <!-- Dashboard -->
        <router-link
          to="/"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/' ? activeBg('indigo') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <HomeIcon class="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          Dashboard
        </router-link>

        <!-- Discover Group -->
        <div>
          <button
            @click="toggleGroup('discover')"
            class="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <span class="flex items-center gap-2">
              <MagnifyingGlassIcon class="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              Discover
            </span>
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.discover ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.discover" class="ml-2 space-y-0.5 mt-0.5">
            <router-link
              to="/search"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/search') ? activeBg('sky') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <MagnifyingGlassIcon class="w-4 h-4 text-sky-500 dark:text-sky-400" />
              Search Developers
            </router-link>
            <router-link
              to="/searches"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/searches') ? activeBg('amber') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <BookmarkIcon class="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Saved Searches
            </router-link>
          </div>
        </div>

        <!-- Candidates Group -->
        <div>
          <button
            @click="toggleGroup('candidates')"
            class="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <span class="flex items-center gap-2">
              <UserCircleIcon class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Candidates
            </span>
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.candidates ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.candidates" class="ml-2 space-y-0.5 mt-0.5">
            <router-link
              to="/collections"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/collections') ? activeBg('yellow') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <FolderIcon class="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              Collections
            </router-link>
            <router-link
              to="/compare"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/compare') ? activeBg('rose') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <ArrowsRightLeftIcon class="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Compare
            </router-link>
            <router-link
              to="/notes-search"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/notes-search') ? activeBg('violet') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <DocumentTextIcon class="w-4 h-4 text-violet-500 dark:text-violet-400" />
              Notes
            </router-link>
          </div>
        </div>

        <!-- Settings Group -->
        <div>
          <button
            @click="toggleGroup('settings')"
            class="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <span class="flex items-center gap-2">
              <Cog6ToothIcon class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Settings
            </span>
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.settings ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.settings" class="ml-2 space-y-0.5 mt-0.5">
            <router-link
              to="/settings/profile"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/settings/profile') ? activeBg('teal') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <UserCircleIcon class="w-4 h-4 text-teal-500 dark:text-teal-400" />
              Profile
            </router-link>
            <router-link
              to="/settings/api"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/settings/api') ? activeBg('orange') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <KeyIcon class="w-4 h-4 text-orange-500 dark:text-orange-400" />
              API Settings
            </router-link>
            <router-link
              to="/settings/appearance"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="isActive('/settings/appearance') ? activeBg('yellow') : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <SunIcon class="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
              Appearance
            </router-link>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-4 lg:px-6 gap-4">
        <button
          @click="sidebarOpen = true"
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 lg:hidden"
          aria-label="Open sidebar"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>

        <!-- Header Search -->
        <div class="relative flex-1 max-w-md hidden sm:block">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-muted pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search developers, collections, notes..."
            class="w-full pl-9 pr-20 py-2 bg-dash-surface border border-dash-border rounded-xl text-sm text-dash-text placeholder-dash-muted/50 focus:outline-none focus:border-dash-primary/50 focus:ring-2 focus:ring-dash-primary/20 transition-all duration-150 shadow-sm"
            @keydown.enter="handleHeaderSearch"
          />
          <kbd class="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-medium text-dash-muted bg-dash-border/30 rounded border border-dash-border/40 pointer-events-none">⌘K</kbd>
        </div>

        <!-- Right-side controls -->
        <div class="hidden sm:flex items-center gap-2 ml-auto">

          <!-- GitHub API — battery widget -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-border/10 border border-dash-border/30 text-xs">
            <span class="text-dash-muted font-semibold uppercase tracking-wider text-[10px]">API</span>
            <template v-if="rateLimit.remaining.value !== null">
              <div class="flex items-center gap-[3px]">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="w-[6px] h-3 rounded-[1px] transition-all duration-300"
                  :class="(rateLimit.remaining.value! / (rateLimit.limit.value ?? 60)) >= i * 0.2
                    ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                    : (rateLimit.remaining.value! / (rateLimit.limit.value ?? 60)) >= (i - 1) * 0.2
                      ? 'bg-dash-warning'
                      : 'bg-dash-border/20'"
                />
              </div>
              <span class="text-dash-text tabular-nums font-bold whitespace-nowrap">{{ rateLimit.remaining.value }}/{{ rateLimit.limit.value }}</span>
            </template>
            <template v-else>
              <div class="flex items-center gap-[3px]">
                <div v-for="i in 5" :key="i" class="w-[6px] h-3 rounded-[1px] bg-dash-border/20" />
              </div>
              <span class="text-dash-muted tabular-nums whitespace-nowrap">--/--</span>
            </template>
          </div>

          <!-- Theme switcher -->
          <div class="relative">
            <button
              @click="showThemeMenu = !showThemeMenu"
              @blur="closeMenuSoon()"
              class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Theme"
              aria-label="Theme settings"
            >
              <SunIcon v-if="ui.themeMode === 'light'" class="w-5 h-5" />
              <MoonIcon v-else-if="ui.themeMode === 'dark'" class="w-5 h-5" />
              <ComputerDesktopIcon v-else class="w-5 h-5" />
            </button>
            <div v-if="showThemeMenu" class="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <button
                @click="ui.setTheme('light'); showThemeMenu = false"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                :class="ui.themeMode === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'"
              >
                <SunIcon class="w-4 h-4" /> Light
              </button>
              <button
                @click="ui.setTheme('dark'); showThemeMenu = false"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                :class="ui.themeMode === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'"
              >
                <MoonIcon class="w-4 h-4" /> Dark
              </button>
              <button
                @click="ui.setTheme('system'); showThemeMenu = false"
                class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                :class="ui.themeMode === 'system' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'"
              >
                <ComputerDesktopIcon class="w-4 h-4" /> System
              </button>
            </div>
          </div>

          <!-- Logout -->
          <button
            @click="auth.logout()"
            class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 p-2"
            aria-label="Sign out"
          >
            <ArrowRightOnRectangleIcon class="w-5 h-5" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" style="max-width: 1440px">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>
