<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { GitHubUser, GitHubRepo } from '../types/github'
import { useCandidateScore } from '../composables/useCandidateScore'
import { ChevronDownIcon, ChevronUpIcon, TrophyIcon } from '@heroicons/vue/24/outline'

interface Props {
  profile: GitHubUser
  repos: GitHubRepo[]
}

const props = defineProps<Props>()

const { calculateScore, getScoreColor, getScoreLabel } = useCandidateScore()
const showDetails = ref(false)
const animatedScore = ref(0)

const scoreResult = computed(() => calculateScore(props.profile, props.repos))
const scoreColor = computed(() => getScoreColor(scoreResult.value.total))
const scoreLabel = computed(() => getScoreLabel(scoreResult.value.total))

// Animated counter on mount
onMounted(() => {
  const target = scoreResult.value.total
  if (target === 0) { animatedScore.value = 0; return }
  const duration = 800
  const start = performance.now()
  function animate(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedScore.value = Math.round(eased * target)
    if (progress < 1) requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
})

// SVG gauge calculations
const radius = 45
const circumference = 2 * Math.PI * radius
const strokeDashoffset = computed(() => {
  const progress = animatedScore.value / 100
  return circumference * (1 - progress)
})

function getProgressBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const gaugeColor = computed(() => {
  if (scoreResult.value.total > 70) return '#22c55e'
  if (scoreResult.value.total >= 40) return '#eab308'
  return '#ef4444'
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Candidate Score</h2>
      <span v-if="scoreResult.total > 70" class="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
        <TrophyIcon class="w-3 h-3" />
        Top Candidate
      </span>
    </div>

    <!-- Overall Score Gauge -->
    <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
      <!-- Circular Gauge -->
      <div class="flex flex-col items-center">
        <div class="relative w-32 h-32">
          <svg class="transform -rotate-90 w-32 h-32" aria-hidden="true">
            <!-- Background circle -->
            <circle
              cx="64" cy="64" :r="radius"
              stroke="currentColor" stroke-width="8" fill="none"
              class="text-gray-200 dark:text-gray-700"
            />
            <!-- Progress circle -->
            <circle
              cx="64" cy="64" :r="radius"
              :stroke="gaugeColor"
              stroke-width="8" fill="none"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
              stroke-linecap="round"
              class="transition-all duration-500 ease-out"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span
              :class="['text-3xl font-bold', scoreColor]"
              role="status"
              :aria-label="`Candidate score: ${scoreResult.total} out of 100, ${scoreLabel}`"
            >
              {{ animatedScore }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
          </div>
        </div>
        <span :class="['mt-2 text-sm font-semibold', scoreResult.rankColor]">{{ scoreResult.rank }}</span>
      </div>

      <!-- Strengths & Weaknesses -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <!-- Strengths -->
        <div v-if="scoreResult.strengths.length > 0" class="space-y-2">
          <h3 class="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Strengths
          </h3>
          <ul class="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            <li v-for="strength in scoreResult.strengths" :key="strength" class="flex items-start gap-2">
              <span class="text-green-500 mt-0.5 shrink-0">✓</span>
              <span>{{ strength }}</span>
            </li>
          </ul>
        </div>

        <!-- Weaknesses -->
        <div v-if="scoreResult.weaknesses.length > 0" class="space-y-2">
          <h3 class="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            Areas for Growth
          </h3>
          <ul class="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
            <li v-for="weakness in scoreResult.weaknesses" :key="weakness" class="flex items-start gap-2">
              <span class="text-amber-500 mt-0.5 shrink-0">△</span>
              <span>{{ weakness }}</span>
            </li>
          </ul>
        </div>

        <!-- Empty state -->
        <div v-if="scoreResult.strengths.length === 0 && scoreResult.weaknesses.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Balanced profile across all factors — consistent performer
        </div>
      </div>
    </div>

    <!-- Toggle Details Button -->
    <button
      @click="showDetails = !showDetails"
      class="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
      :aria-expanded="showDetails"
      aria-controls="score-details"
    >
      <span>{{ showDetails ? 'Hide' : 'Show' }} score breakdown</span>
      <ChevronDownIcon v-if="!showDetails" class="w-4 h-4" />
      <ChevronUpIcon v-else class="w-4 h-4" />
    </button>

    <!-- Factor Breakdown -->
    <div
      v-if="showDetails"
      id="score-details"
      class="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Score Breakdown</h3>
      <div class="space-y-4">
        <div
          v-for="factor in scoreResult.factors"
          :key="factor.name"
          class="space-y-1.5"
        >
          <!-- Factor header -->
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span>{{ factor.icon }}</span>
              {{ factor.name }}
              <span class="text-xs text-gray-500 dark:text-gray-400">({{ Math.round(factor.weight * 100) }}%)</span>
            </span>
            <span :class="['font-semibold', getScoreColor(factor.score)]">
              {{ factor.score }}
            </span>
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              :class="['h-2 rounded-full transition-all duration-700 ease-out', getProgressBarColor(factor.score)]"
              :style="{ width: `${factor.score}%` }"
              role="progressbar"
              :aria-valuenow="factor.score"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`${factor.name}: ${factor.score} out of 100`"
            />
          </div>

          <!-- Description + Detail -->
          <div class="flex items-start justify-between">
            <p class="text-xs text-gray-500 dark:text-gray-400 flex-1">{{ factor.description }}</p>
            <span v-if="factor.detail" class="text-xs ml-2 shrink-0" :class="getScoreColor(factor.score)">
              {{ factor.detail }}
            </span>
          </div>
        </div>

        <!-- Weight summary -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <p class="text-xs text-gray-400 dark:text-gray-500 text-center">
            Weighted score: {{ scoreResult.total }}/100 ·
            <span v-for="(f, i) in scoreResult.factors" :key="f.name">
              {{ f.name }} {{ Math.round(f.weight * 100) }}%{{ i < scoreResult.factors.length - 1 ? ' + ' : '' }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
