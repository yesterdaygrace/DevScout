<script setup lang="ts">
import SkeletonCard from './SkeletonCard.vue'

interface InsightData {
  topLanguages: { name: string; count: number }[]
  peakTime: string
  avgSearchesPerDay: number
  totalDevsViewed: number
}

interface Props {
  data: InsightData | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-dash-text mb-4">Insights</h3>

    <div v-if="loading">
      <SkeletonCard type="card" :count="1" class="min-h-[320px]" />
    </div>
    <div v-else-if="data" class="bg-dash-surface rounded-xl border border-dash-border/60 p-5 flex items-center divide-x divide-dash-border/40">
      <!-- Top Language -->
      <div class="flex-1 flex items-center justify-center gap-3 px-4">
        <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-dash-muted uppercase tracking-wider font-semibold">Top Language</p>
          <p class="text-base font-bold text-dash-text">{{ data.topLanguages[0]?.name || '—' }}</p>
        </div>
      </div>

      <!-- Peak Search Time -->
      <div class="flex-1 flex items-center justify-center gap-3 px-4">
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-dash-muted uppercase tracking-wider font-semibold">Peak Hour</p>
          <p class="text-base font-bold text-dash-text tabular-nums">{{ data.peakTime }}</p>
        </div>
      </div>

      <!-- Avg Searches/Day -->
      <div class="flex-1 flex items-center justify-center gap-3 px-4">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-dash-muted uppercase tracking-wider font-semibold">Avg / Day</p>
          <p class="text-base font-bold text-dash-text tabular-nums">{{ data.avgSearchesPerDay }}</p>
        </div>
      </div>

      <!-- Devs Viewed -->
      <div class="flex-1 flex items-center justify-center gap-3 px-4">
        <div class="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-dash-muted uppercase tracking-wider font-semibold">Viewed</p>
          <p class="text-base font-bold text-dash-text tabular-nums">{{ data.totalDevsViewed }}</p>
        </div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center text-xs text-dash-muted min-h-[80px]">
      No insights available yet.
    </div>
  </div>
</template>
