<script setup lang="ts">
import type { FunctionalComponent } from 'vue'
import { onMounted, ref, watch } from 'vue'
import { MagnifyingGlassIcon, FolderIcon, UserGroupIcon, BookmarkIcon } from '@heroicons/vue/24/outline'
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
  <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <SkeletonCard v-for="n in 4" :key="n" type="card" :count="1" />
  </div>
  <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <router-link
      v-for="(metric, idx) in metrics"
      :key="metric.title"
      :to="metric.link"
      class="group relative rounded-[var(--radius-lg)] p-6 flex flex-col transition-colors cursor-pointer overflow-hidden col-span-1 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10] min-h-[180px]"
    >
      <!-- Label -->
      <div class="flex items-center justify-between">
        <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/30">
          {{ metric.title }}
        </p>
        <div class="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
          <component :is="getIcon(metric.icon)" class="w-4 h-4 text-white/40" />
        </div>
      </div>

      <!-- Value -->
      <p
        class="font-bold tabular-nums tracking-[-0.04em] leading-none mt-auto text-white text-[36px]"
      >
        {{ animatedValues[idx] ?? metric.value }}
      </p>

      <!-- Secondary -->
      <div class="flex items-center gap-2 mt-2">
        <span
          v-if="metric.trend !== null"
          class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
          :class="metric.trend >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'"
        >
          {{ metric.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(metric.trend) }}%
        </span>
        <span class="text-xs text-white/40">{{ metric.secondary }}</span>
      </div>


    </router-link>
  </div>
</template>
