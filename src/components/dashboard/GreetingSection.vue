<script setup lang="ts">
import { computed } from 'vue'
import { MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'

interface Props {
  username?: string
  lastQuery?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  username: 'there',
  lastQuery: null,
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
})
</script>

<template>
  <div class="bg-gradient-to-br from-dash-surface via-dash-surface to-dash-border/20 rounded-2xl border border-dash-border/60 p-6 sm:p-8 relative overflow-hidden">
    <!-- Decorative glow -->
    <div class="absolute top-0 right-0 w-64 h-64 bg-dash-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

    <div class="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
      <div class="max-w-xl">
        <h1 class="text-[32px] sm:text-[40px] font-bold text-dash-text leading-tight tracking-tight">
          {{ greeting }} 👋
        </h1>
        <p class="mt-2 text-sm sm:text-base text-dash-muted leading-relaxed">
          Track candidates, compare developers, and manage your hiring workspace.
        </p>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <router-link
          to="/search"
          class="inline-flex items-center gap-2 px-6 py-3 bg-dash-primary text-white text-sm font-medium rounded-xl hover:bg-dash-primary-hover transition-all duration-150 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
        >
          <MagnifyingGlassIcon class="w-4.5 h-4.5" />
          Search Developers
        </router-link>
        <router-link
          v-if="lastQuery"
          :to="`/search?q=${encodeURIComponent(lastQuery)}`"
          class="inline-flex items-center gap-2 px-6 py-3 border border-dash-border text-dash-text text-sm font-medium rounded-xl hover:bg-dash-surface hover:border-dash-primary/30 transition-all duration-150 hover:-translate-y-0.5"
        >
          <ArrowUturnLeftIcon class="w-4.5 h-4.5" />
          Continue Search
        </router-link>
      </div>
    </div>
  </div>
</template>
