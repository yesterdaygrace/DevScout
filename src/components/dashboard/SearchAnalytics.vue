<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler,
} from 'chart.js'
import SkeletonCard from './SkeletonCard.vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

interface DailyPoint {
  date: string
  count: number
}

interface Props {
  data: {
    daily: DailyPoint[]
    total: number
    unique: number
    today: number
  } | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const dateFilter = ref<'today' | '7d' | '30d' | 'all'>('7d')

const filteredDaily = computed(() => {
  if (!props.data?.daily) return []
  const now = new Date()
  const cutoff = new Date(now)
  if (dateFilter.value === 'today') cutoff.setDate(cutoff.getDate() - 1)
  else if (dateFilter.value === '7d') cutoff.setDate(cutoff.getDate() - 7)
  else if (dateFilter.value === '30d') cutoff.setDate(cutoff.getDate() - 30)
  else return props.data.daily
  return props.data.daily.filter(d => new Date(d.date) >= cutoff)
})

const chartData = computed(() => ({
  labels: filteredDaily.value.map(d => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }),
  datasets: [{
    label: 'Searches',
    data: filteredDaily.value.map(d => d.count),
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 245, 0.08)',
    fill: true,
    tension: 0.35,
    pointRadius: 2,
    pointHoverRadius: 5,
    pointBackgroundColor: '#6366F1',
    borderWidth: 2,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' as const },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1E293B',
      titleColor: '#F8FAFC',
      bodyColor: '#94A3B8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, color: '#94A3B8', font: { size: 11 } },
      grid: { color: 'rgba(148, 163, 184, 0.08)' },
    },
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { display: false },
    },
  },
}

const filters = [
  { key: 'today' as const, label: 'Today' },
  { key: '7d' as const, label: '7 Days' },
  { key: '30d' as const, label: '30 Days' },
  { key: 'all' as const, label: 'All Time' },
]
</script>

<template>
  <div class="bg-dash-card rounded-xl border border-dash-border p-5 min-h-[320px] flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-dash-text-secondary">Search Analytics</h3>
      <div class="flex gap-1">
        <button
          v-for="f in filters"
          :key="f.key"
          @click="dateFilter = f.key"
          class="px-2.5 py-1 text-xs rounded-md transition-all duration-150 cursor-pointer"
          :class="dateFilter === f.key ? 'bg-dash-primary text-white' : 'text-dash-text-tertiary hover:text-dash-text-secondary hover:bg-dash-border/30'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex-1">
      <SkeletonCard type="chart" />
    </div>
    <div v-else-if="!data || filteredDaily.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 rounded-xl bg-dash-border/10 flex items-center justify-center mx-auto mb-3">
          <svg class="w-5 h-5 text-dash-text-tertiary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-3 6h-2.25m-4.5 0H7.5" /></svg>
        </div>
        <p class="text-sm text-dash-text-tertiary">No search data yet</p>
        <p class="text-xs text-dash-text-tertiary/60 mt-1">Start searching to see analytics</p>
      </div>
    </div>
    <template v-else>
      <div class="flex-1 min-h-0">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-dash-border flex-shrink-0">
        <div class="text-center">
          <p class="text-lg font-bold text-dash-text-secondary tabular-nums">{{ data.total }}</p>
          <p class="text-[11px] text-dash-text-tertiary">Total Searches</p>
        </div>
        <div class="text-center">
          <p class="text-lg font-bold text-dash-text-secondary tabular-nums">{{ data.unique }}</p>
          <p class="text-[11px] text-dash-text-tertiary">Unique Queries</p>
        </div>
        <div class="text-center">
          <p class="text-lg font-bold text-dash-primary tabular-nums">{{ data.today }}</p>
          <p class="text-[11px] text-dash-text-tertiary">Today</p>
        </div>
      </div>
    </template>
  </div>
</template>
