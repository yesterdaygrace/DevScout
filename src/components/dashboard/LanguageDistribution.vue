<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import SkeletonCard from './SkeletonCard.vue'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

interface LangItem {
  name: string
  count: number
  percentage: number
}

interface Props {
  data: LangItem[] | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const COLORS = ['#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#F43F5E']

// Limit to top 5
const topData = computed(() => (props.data || []).slice(0, 5))

const totalLanguages = computed(() => topData.value.reduce((s, d) => s + d.count, 0))

// Chart.js plugin to render total count in center of doughnut
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart: any) {
    const { ctx, width, height } = chart
    ctx.save()
    const centerX = width / 2
    const centerY = height / 2 - 4

    // Total number
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '700 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#F1F5F9'
    ctx.fillText(String(totalLanguages.value), centerX, centerY - 8)

    // Label below
    ctx.font = '400 11px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#94A3B8'
    ctx.fillText('languages', centerX, centerY + 18)

    ctx.restore()
  },
}

const chartData = computed(() => ({
  labels: topData.value.map(d => d.name),
  datasets: [{
    data: topData.value.map(d => d.count),
    backgroundColor: COLORS.slice(0, topData.value.length),
    borderWidth: 0,
    hoverOffset: 8,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1E293B',
      titleColor: '#F8FAFC',
      bodyColor: '#94A3B8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (ctx: any) => {
          const item = topData.value[ctx.dataIndex]
          return item ? `${item.name}: ${item.count} (${item.percentage}%)` : ''
        },
      },
    },
  },
}
</script>

<template>
  <div class="bg-dash-surface rounded-xl border border-dash-border/60 p-5 min-h-[320px] flex flex-col">
    <h3 class="text-sm font-semibold text-dash-text mb-4">Language Distribution</h3>

    <div v-if="loading" class="flex-1">
      <SkeletonCard type="chart" />
    </div>
    <div v-else-if="!data || data.length === 0" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <p class="text-2xl mb-2">🔤</p>
        <p class="text-sm text-dash-muted">No language data yet</p>
        <p class="text-xs text-dash-muted/60 mt-1">Languages appear when you filter by language in search.</p>
      </div>
    </div>
    <template v-else>
      <div class="flex-1 min-h-0 flex items-center justify-center">
        <div class="w-full max-w-[200px]">
          <Doughnut :data="chartData" :options="chartOptions" :plugins="[centerTextPlugin]" />
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-dash-border grid grid-cols-1 gap-1.5 flex-shrink-0">
        <div
          v-for="(item, idx) in topData"
          :key="item.name"
          class="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-dash-border/10 transition-colors"
        >
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: COLORS[idx] }" />
          <span class="text-xs text-dash-muted truncate flex-1">{{ item.name }}</span>
          <span class="text-xs font-medium text-dash-text tabular-nums">{{ item.count }}</span>
          <span class="text-[11px] text-dash-muted/60 tabular-nums w-[38px] text-right">{{ item.percentage }}%</span>
        </div>
      </div>
      <div v-if="data && data.length > 5" class="mt-2 text-[11px] text-dash-muted/50 text-center">
        +{{ data.length - 5 }} more languages
      </div>
    </template>
  </div>
</template>
