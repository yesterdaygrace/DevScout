<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContributionWeek, ConsistencyStats, ContributionDay } from '../../types/github'
import { InformationCircleIcon, FireIcon, CalendarDaysIcon, BoltIcon } from '@heroicons/vue/24/outline'

interface Props {
  calendar: {
    totalContributions: number
    weeks: ContributionWeek[]
  }
  consistency: ConsistencyStats
  hasPrivateActivityDisclaimer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasPrivateActivityDisclaimer: true,
})

const showFullYear = ref(false)
const hoveredDay = ref<{ day: ContributionDay; x: number; y: number } | null>(null)

// If screen is narrow, show last 16 weeks by default unless toggled
const displayedWeeks = computed(() => {
  if (!showFullYear.value && props.calendar.weeks.length > 16) {
    return props.calendar.weeks.slice(-16)
  }
  return props.calendar.weeks
})

const monthLabels = computed(() => {
  const labels: { text: string; x: number }[] = []
  let lastMonth = ''

  displayedWeeks.value.forEach((week, wIdx) => {
    const firstDay = week.days[0]
    if (firstDay && firstDay.date) {
      const date = new Date(firstDay.date)
      const month = date.toLocaleString('default', { month: 'short' })
      if (month !== lastMonth) {
        labels.push({ text: month, x: wIdx * 14 + 28 })
        lastMonth = month
      }
    }
  })
  return labels
})

const dayLabels = ['Mon', 'Wed', 'Fri']

function getLevelColor(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 1:
      return 'rgba(16, 185, 129, 0.35)'
    case 2:
      return 'rgba(16, 185, 129, 0.6)'
    case 3:
      return 'rgba(16, 185, 129, 0.85)'
    case 4:
      return '#34d399'
    default:
      return 'rgba(255, 255, 255, 0.05)'
  }
}

function getTierBadgeClass(tier: ConsistencyStats['tier']): string {
  switch (tier) {
    case 'Exceptional':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'Consistent':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    case 'Moderate':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'Sporadic':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
    default:
      return 'bg-white/10 text-white/50 border-white/10'
  }
}

function handleMouseEnter(day: ContributionDay, event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement | SVGElement).getBoundingClientRect()
  hoveredDay.value = {
    day,
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }
}

function handleMouseLeave() {
  hoveredDay.value = null
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 lg:p-8 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h3 class="text-headline text-white flex items-center gap-2">
            <CalendarDaysIcon class="w-5 h-5 text-white/50" />
            Commit & contribution activity
          </h3>
          <span
            :class="getTierBadgeClass(consistency.tier)"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase"
          >
            {{ consistency.tier }} Consistency
          </span>
        </div>
        <p class="text-xs text-white/40 mt-1">
          {{ calendar.totalContributions.toLocaleString() }} public contributions in the past 52 weeks
        </p>
      </div>

      <!-- Consistency KPI Pills -->
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
          <BoltIcon class="w-3.5 h-3.5 text-emerald-400" />
          <span>{{ consistency.activeWeeks }}/{{ consistency.totalWeeks }} active weeks</span>
          <span class="text-white/40 font-mono">({{ Math.round(consistency.activeWeeksRatio * 100) }}%)</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
          <FireIcon class="w-3.5 h-3.5 text-amber-400" />
          <span>Longest streak: <strong class="text-white">{{ consistency.longestStreak }}d</strong></span>
        </div>
        <div v-if="consistency.currentStreak > 0" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <span>Current streak: <strong>{{ consistency.currentStreak }}d</strong></span>
        </div>
      </div>
    </div>

    <!-- Recruiter Transparency Banner -->
    <div
      v-if="hasPrivateActivityDisclaimer"
      class="flex items-start gap-2.5 px-3.5 py-2.5 rounded-[var(--radius-md)] bg-white/[0.02] border border-white/5 text-[12px] text-white/50"
    >
      <InformationCircleIcon class="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
      <span>
        <strong>Recruiter Note:</strong> Displays public GitHub contributions. Enterprise and private repository commits remain hidden unless the candidate has explicitly enabled private contribution graph visibility on GitHub.
      </span>
    </div>

    <!-- Mobile view controls -->
    <div class="flex items-center justify-between text-xs text-white/50 sm:hidden">
      <span>Showing: {{ showFullYear ? 'Full year (52 weeks)' : 'Recent 16 weeks' }}</span>
      <button
        @click="showFullYear = !showFullYear"
        class="text-white underline underline-offset-4 cursor-pointer hover:text-white/80"
      >
        {{ showFullYear ? 'Show 16 weeks' : 'Show full year' }}
      </button>
    </div>

    <!-- Heatmap Graphic (SVG) -->
    <div class="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
      <div class="min-w-fit">
        <svg
          :width="displayedWeeks.length * 14 + 36"
          height="124"
          class="block select-none"
        >
          <!-- Month labels -->
          <g class="text-[10px] fill-white/40 font-mono">
            <text
              v-for="(label, idx) in monthLabels"
              :key="idx"
              :x="label.x"
              y="12"
            >
              {{ label.text }}
            </text>
          </g>

          <!-- Day of week labels -->
          <g class="text-[9px] fill-white/30 font-mono">
            <text x="4" y="38">{{ dayLabels[0] }}</text>
            <text x="4" y="66">{{ dayLabels[1] }}</text>
            <text x="4" y="94">{{ dayLabels[2] }}</text>
          </g>

          <!-- Week columns -->
          <g
            v-for="(week, wIdx) in displayedWeeks"
            :key="wIdx"
            :transform="`translate(${wIdx * 14 + 28}, 20)`"
          >
            <rect
              v-for="(day, dIdx) in week.days"
              :key="day.date || dIdx"
              :y="dIdx * 14"
              width="11"
              height="11"
              rx="2.5"
              :fill="getLevelColor(day.level)"
              class="cursor-pointer transition-opacity hover:opacity-80 stroke-black/20 stroke-[0.5]"
              @mouseenter="handleMouseEnter(day, $event)"
              @mouseleave="handleMouseLeave"
            />
          </g>
        </svg>
      </div>
    </div>

    <!-- Floating Tooltip -->
    <div
      v-if="hoveredDay"
      class="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded bg-black/90 border border-white/20 text-white text-xs shadow-xl backdrop-blur"
      :style="{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }"
    >
      <div class="font-medium">
        {{ hoveredDay.day.count }} {{ hoveredDay.day.count === 1 ? 'contribution' : 'contributions' }}
      </div>
      <div class="text-[10px] text-white/50">
        {{ formatDate(hoveredDay.day.date) }}
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-between text-xs text-white/40 pt-1 border-t border-white/5">
      <div class="text-[11px]">
        {{ consistency.activeWeeksRatio >= 0.6 ? '🔥 Consistently active throughout the year' : '⚡ Intermittent or focused burst contributor' }}
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px]">Less</span>
        <div class="w-2.5 h-2.5 rounded-sm bg-white/[0.05] border border-white/5" />
        <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500/35" />
        <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
        <div class="w-2.5 h-2.5 rounded-sm bg-emerald-500/85" />
        <div class="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
        <span class="text-[10px]">More</span>
      </div>
    </div>
  </div>
</template>
