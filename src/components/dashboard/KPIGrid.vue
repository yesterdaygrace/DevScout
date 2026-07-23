<script setup lang="ts">
import type { FunctionalComponent } from 'vue'
import { onMounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon, FolderIcon, BookmarkIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import SkeletonCard from './SkeletonCard.vue'

interface Metric {
  title: string
  value: number
  secondary: string
  icon: string
  trend: number | null
  link: string
  color: string
}

interface Props {
  metrics: Metric[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const iconMap: Record<string, FunctionalComponent> = {
  search: MagnifyingGlassIcon,
  collection: FolderIcon,
  shortlist: UserGroupIcon,
  saved: BookmarkIcon,
}

function getIcon(name: string): FunctionalComponent {
  return iconMap[name] || MagnifyingGlassIcon
}

// Counter animation
const animatedValues = ref<number[]>([])

function animateCounters() {
  animatedValues.value = props.metrics.map(() => 0)
  const durations = props.metrics.map(() => 500 + Math.random() * 300)
  const startTimes = props.metrics.map(() => performance.now())

  function tick() {
    let allDone = true
    const next = props.metrics.map((m, i) => {
      const elapsed = performance.now() - startTimes[i]
      const progress = Math.min(elapsed / durations[i], 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const val = Math.round(eased * m.value)
      if (progress < 1) allDone = false
      return val
    })
    animatedValues.value = next
    if (!allDone) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  if (!props.loading) animateCounters()
})

watch(() => props.metrics, (newVal) => {
  if (newVal.length > 0 && !props.loading) animateCounters()
}, { immediate: false })
</script>

<template>
  <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <SkeletonCard v-for="n in 4" :key="n" type="card" :count="1" />
  </div>
  <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-6">
    <router-link
      v-for="(metric, idx) in metrics"
      :key="metric.title"
      :to="metric.link"
      class="group relative bg-dash-surface rounded-xl border border-dash-border/60 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col min-h-[140px]"
      :class="{
        'hover:border-indigo-400/40 hover:shadow-indigo-500/5': metric.color === 'indigo',
        'hover:border-emerald-400/40 hover:shadow-emerald-500/5': metric.color === 'emerald',
        'hover:border-amber-400/40 hover:shadow-amber-500/5': metric.color === 'amber',
        'hover:border-violet-400/40 hover:shadow-violet-500/5': metric.color === 'violet',
      }"
    >
      <!-- Icon + Title row -->
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150"
          :class="{
            'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/15': metric.color === 'indigo',
            'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/15': metric.color === 'emerald',
            'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/15': metric.color === 'amber',
            'bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/15': metric.color === 'violet',
          }"
        >
          <component :is="getIcon(metric.icon)" class="w-5 h-5" />
        </div>
        <p class="text-xs font-semibold text-dash-muted uppercase tracking-wide">
          {{ metric.title }}
        </p>
      </div>

      <!-- Value - metric dominates -->
      <p class="text-[34px] sm:text-[40px] font-bold text-dash-text tabular-nums tracking-tight leading-none mt-auto">
        {{ animatedValues[idx] ?? metric.value }}
      </p>

      <!-- Trend and Secondary -->
      <div class="flex items-center gap-2 mt-2">
        <span
          v-if="metric.trend !== null"
          class="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full"
          :class="metric.trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'"
        >
          <svg v-if="metric.trend >= 0" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          <svg v-else class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          {{ Math.abs(metric.trend) }}%
        </span>
        <span class="text-xs text-dash-muted/70">{{ metric.secondary }}</span>
      </div>
    </router-link>
  </div>
</template>
