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
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const ui = useUiStore()
const rateLimit = useRateLimit()
const route = useRoute()
const router = useRouter()
const showThemeMenu = ref(false)

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
</script>

<template>
  <div class="min-h-screen flex bg-dash-bg">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar — premium, restrained -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0F172A] border-r border-white/[0.06] flex flex-col transform transition-transform duration-200 lg:relative lg:translate-x-0 shrink-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between h-[64px] px-6 shrink-0">
        <router-link
          to="/"
          class="text-[22px] font-bold tracking-[-0.03em] text-white"
          style="font-family: 'Space Grotesk', sans-serif"
          @click="sidebarOpen = false"
        >
          DevScout<span class="text-dash-primary">.</span>
        </router-link>
        <button
          @click="sidebarOpen = false"
          class="p-2 text-white/40 hover:text-white lg:hidden cursor-pointer"
          aria-label="Close sidebar"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 p-4 space-y-6 overflow-y-auto">
        <!-- Primary -->
        <div class="space-y-1">
          <router-link
            to="/"
            @click="sidebarOpen = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[14px] font-medium transition-colors cursor-pointer"
            :class="route.path === '/' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
          >
            <HomeIcon class="w-[18px] h-[18px]" :class="route.path === '/' ? 'text-black' : 'text-white/40'" />
            Dashboard
          </router-link>
        </div>

        <!-- Discover -->
        <div class="space-y-2">
          <button
            @click="toggleGroup('discover')"
            class="flex items-center justify-between w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            Discover
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.discover ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.discover" class="space-y-1">
            <router-link
              to="/search"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] font-medium transition-colors cursor-pointer"
              :class="isActive('/search') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <MagnifyingGlassIcon class="w-4 h-4" :class="isActive('/search') ? 'text-black' : 'text-white/40'" />
              Search Developers
            </router-link>
            <router-link
              to="/searches"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/searches') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <BookmarkIcon class="w-4 h-4" :class="isActive('/searches') ? 'text-black' : 'text-white/40'" />
              Saved Searches
            </router-link>
          </div>
        </div>

        <!-- Candidates -->
        <div class="space-y-2">
          <button
            @click="toggleGroup('candidates')"
            class="flex items-center justify-between w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            Candidates
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.candidates ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.candidates" class="space-y-1">
            <router-link
              to="/collections"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/collections') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <FolderIcon class="w-4 h-4" :class="isActive('/collections') ? 'text-black' : 'text-white/40'" />
              Collections
            </router-link>
            <router-link
              to="/compare"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/compare') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <ArrowsRightLeftIcon class="w-4 h-4" :class="isActive('/compare') ? 'text-black' : 'text-white/40'" />
              Compare
            </router-link>
            <router-link
              to="/notes-search"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/notes-search') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <DocumentTextIcon class="w-4 h-4" :class="isActive('/notes-search') ? 'text-black' : 'text-white/40'" />
              Notes
            </router-link>
          </div>
        </div>

        <!-- Settings -->
        <div class="space-y-2">
          <button
            @click="toggleGroup('settings')"
            class="flex items-center justify-between w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30 hover:text-white/50 transition-colors cursor-pointer"
          >
            Settings
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="expandedGroups.settings ? 'rotate-0' : '-rotate-90'" />
          </button>
          <div v-if="expandedGroups.settings" class="space-y-1">
            <router-link
              to="/settings/profile"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/settings/profile') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <DocumentTextIcon class="w-4 h-4" :class="isActive('/settings/profile') ? 'text-black' : 'text-white/40'" />
              Profile
            </router-link>
            <router-link
              to="/settings/api"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/settings/api') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <MagnifyingGlassIcon class="w-4 h-4" :class="isActive('/settings/api') ? 'text-black' : 'text-white/40'" />
              API Settings
            </router-link>
            <router-link
              to="/settings/appearance"
              @click="sidebarOpen = false"
              class="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-colors cursor-pointer"
              :class="isActive('/settings/appearance') ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'"
            >
              <SunIcon class="w-4 h-4" :class="isActive('/settings/appearance') ? 'text-black' : 'text-white/40'" />
              Appearance
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Bottom — user + logout -->
      <div class="p-4 border-t border-white/[0.06] space-y-3">
        <div class="flex items-center gap-3 px-2">
          <div class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">{{ (auth.user?.email || 'U').charAt(0).toUpperCase() }}</div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-white truncate">{{ auth.user?.email || 'Developer' }}</p>
          </div>
        </div>
        <button
          @click="auth.logout()"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar — minimal, sticky -->
      <header class="h-[64px] sticky top-0 z-30 bg-dash-bg/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-8 gap-4">
        <button
          @click="sidebarOpen = true"
          class="p-2 -ml-2 text-white/40 hover:text-white lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Bars3Icon class="w-5 h-5" />
        </button>

        <!-- Header Search — editorial minimal -->
        <div class="relative flex-1 max-w-[480px] hidden sm:block">
          <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search developers, collections..."
            class="w-full pl-9 pr-16 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.08] focus:border-white/15 transition-colors"
            @keydown.enter="handleHeaderSearch"
          />
          <span class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-medium text-white/30 bg-white/[0.06] rounded-full border border-white/[0.06] pointer-events-none">⌘K</span>
        </div>

        <!-- Right -->
        <div class="flex items-center gap-3 ml-auto">
          <!-- API — refined -->
          <div class="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span class="text-[10px] font-bold tracking-[0.14em] text-white/30">API</span>
            <div class="flex items-center gap-1">
              <div
                v-for="i in 4"
                :key="i"
                class="w-1.5 h-1.5 rounded-full transition-colors"
                :class="(rateLimit.remaining.value !== null && (rateLimit.remaining.value! / (rateLimit.limit.value ?? 60)) >= i * 0.25) ? 'bg-emerald-400' : 'bg-white/15'"
              />
            </div>
            <span class="text-xs font-medium text-white/70 tabular-nums">{{ rateLimit.remaining.value ?? '—' }}/{{ rateLimit.limit.value ?? '60' }}</span>
          </div>

          <!-- Theme -->
          <div class="relative">
            <button
              @click="showThemeMenu = !showThemeMenu"
              @blur="closeMenuSoon()"
              class="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
              aria-label="Theme"
            >
              <SunIcon v-if="ui.themeMode === 'light'" class="w-4 h-4" />
              <MoonIcon v-else-if="ui.themeMode === 'dark'" class="w-4 h-4" />
              <ComputerDesktopIcon v-else class="w-4 h-4" />
            </button>
            <div v-if="showThemeMenu" class="absolute right-0 mt-3 w-40 bg-[#0F172A] border border-white/10 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden z-10">
              <button
                @click="ui.setTheme('light'); showThemeMenu = false"
                class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-white/[0.06] cursor-pointer"
                :class="ui.themeMode === 'light' ? 'text-white' : 'text-white/60'"
              >
                <SunIcon class="w-4 h-4" /> Light
              </button>
              <button
                @click="ui.setTheme('dark'); showThemeMenu = false"
                class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-white/[0.06] cursor-pointer"
                :class="ui.themeMode === 'dark' ? 'text-white' : 'text-white/60'"
              >
                <MoonIcon class="w-4 h-4" /> Dark
              </button>
              <button
                @click="ui.setTheme('system'); showThemeMenu = false"
                class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 hover:bg-white/[0.06] cursor-pointer"
                :class="ui.themeMode === 'system' ? 'text-white' : 'text-white/60'"
              >
                <ComputerDesktopIcon class="w-4 h-4" /> System
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content — premium spacing -->
      <main class="flex-1 w-full mx-auto px-6 lg:px-10 py-12 lg:py-16" style="max-width: 1440px">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>
