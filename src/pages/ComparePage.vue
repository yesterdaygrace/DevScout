<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useCompareStore } from '../stores/compare'
import { getSkillBreakdown, getUser, getUserRepos } from '../api/github'
import { useCandidateScore } from '../composables/useCandidateScore'
import type { GitHubUser, GitHubRepo, SkillBreakdown } from '../types/github'
import { XMarkIcon, CodeBracketIcon, ArrowTrendingUpIcon, TrophyIcon } from '@heroicons/vue/24/outline'

const compareStore = useCompareStore()
const { calculateScore, getScoreColor, getScoreLabel } = useCandidateScore()

interface ProfileData {
  user: GitHubUser
  repos: GitHubRepo[]
  skills: SkillBreakdown[]
}

const profiles = ref<ProfileData[]>([])
const loading = ref(false)

const scoreResults = computed(() =>
  profiles.value.map(p => calculateScore(p.user, p.repos))
)

const totalStarsList = computed(() =>
  profiles.value.map(p => p.repos.reduce((sum, r) => sum + r.stargazers_count, 0))
)

const topLanguages = computed(() => {
  return profiles.value.map(p => {
    const langCount: Record<string, number> = {}
    p.repos.forEach(r => {
      if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1
    })
    return Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang)
  })
})

const activityRate = computed(() =>
  profiles.value.map(p => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const recent = p.repos.filter(r => new Date(r.updated_at) >= threeMonthsAgo)
    return p.repos.length > 0 ? Math.round((recent.length / p.repos.length) * 100) : 0
  })
)

const avgStars = computed(() =>
  profiles.value.map(p => {
    if (p.repos.length === 0) return 0
    const total = p.repos.reduce((sum, r) => sum + r.stargazers_count, 0)
    return Math.round(total / p.repos.length)
  })
)

const forkRatios = computed(() =>
  profiles.value.map(p => {
    if (p.repos.length === 0) return 0
    const forked = p.repos.filter(r => r.fork).length
    return Math.round((forked / p.repos.length) * 100)
  })
)

const accountAge = computed(() =>
  profiles.value.map(p => {
    const created = new Date(p.user.created_at)
    const now = new Date()
    const years = (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    return years.toFixed(1)
  })
)

/**
 * Find the index(es) with the max value for a given metric array.
 * For "lower is better" metrics like fork ratio, invert the comparison.
 */
function getWinnerIdxs(values: number[], lowerBetter = false): number[] {
  if (values.length === 0) return []
  const best = lowerBetter ? Math.min(...values) : Math.max(...values)
  return values.map((v, i) => (v === best ? i : -1)).filter(i => i >= 0)
}

onMounted(async () => {
  if (compareStore.usernames.length === 0) return
  loading.value = true
  const results = await Promise.all(
    compareStore.usernames.map(async (username) => {
      const [user, repos, skills] = await Promise.all([
        getUser(username),
        getUserRepos(username),
        getSkillBreakdown(username),
      ])
      return { user, repos, skills }
    })
  )
  profiles.value = results
  loading.value = false
})
</script>

<template>
  <div class="space-y-10">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-dash-text">Compare Developers</h1>
      <button
        @click="compareStore.clear(); profiles = []"
        class="text-sm text-dash-text-tertiary hover:text-dash-danger transition-colors cursor-pointer"
      >
        Clear all
      </button>
    </div>

    <div v-if="compareStore.usernames.length === 0" class="text-center py-16">
      <div class="flex flex-col items-center gap-4">
        <div class="w-16 h-16 rounded-xl bg-dash-border/10 flex items-center justify-center">
          <ArrowTrendingUpIcon class="w-8 h-8 text-dash-text-tertiary/40" />
        </div>
        <p class="text-dash-text-tertiary">No developers selected for comparison.</p>
        <router-link to="/search" class="text-dash-primary hover:underline cursor-pointer">Search developers</router-link>
      </div>
    </div>

    <div v-else-if="loading" class="text-center py-12 text-dash-text-tertiary">
      <div class="animate-pulse grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="p-6 bg-dash-card rounded-lg border border-dash-border space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-dash-border/30 animate-pulse" aria-hidden="true" />
            <div class="space-y-2 flex-1">
              <div class="h-4 w-1/2 bg-dash-border/30 rounded animate-pulse" aria-hidden="true" />
              <div class="h-3 w-1/3 bg-dash-border/30 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-10">
      <!-- Profile Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="(profile, idx) in profiles"
          :key="profile.user.login"
          class="p-6 bg-dash-card rounded-lg border border-dash-border"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <img :src="profile.user.avatar_url" :alt="profile.user.login" class="w-12 h-12 rounded-full" loading="lazy" />
              <div>
                <p class="font-semibold text-dash-text">{{ profile.user.name || profile.user.login }}</p>
                <p class="text-sm text-dash-text-tertiary">@{{ profile.user.login }}</p>
              </div>
            </div>
            <button @click="compareStore.remove(profile.user.login); profiles = profiles.filter(p => p.user.login !== profile.user.login)" class="cursor-pointer">
              <XMarkIcon class="w-5 h-5 text-dash-text-tertiary hover:text-dash-danger" />
            </button>
          </div>

          <!-- Score Gauge -->
          <div class="mt-4 flex items-center justify-center">
            <div class="flex flex-col items-center">
              <div class="relative w-20 h-20">
                <svg class="transform -rotate-90 w-20 h-20" aria-hidden="true">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" stroke-width="6" fill="none" class="text-dash-border/30" />
                  <circle
                    cx="40" cy="40" r="32"
                    :stroke="scoreResults[idx]?.total > 70 ? '#22c55e' : scoreResults[idx]?.total >= 40 ? '#eab308' : '#ef4444'"
                    stroke-width="6" fill="none"
                    :stroke-dasharray="2 * Math.PI * 32"
                    :stroke-dashoffset="2 * Math.PI * 32 * (1 - (scoreResults[idx]?.total || 0) / 100)"
                    stroke-linecap="round"
                    class="transition-all duration-500"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span :class="['text-lg font-bold', getScoreColor(scoreResults[idx]?.total || 0)]">
                    {{ scoreResults[idx]?.total || 'N/A' }}
                  </span>
                </div>
              </div>
              <span :class="['text-xs font-medium', getScoreColor(scoreResults[idx]?.total || 0)]">
                {{ scoreResults[idx] ? getScoreLabel(scoreResults[idx].total) : '' }}
              </span>
            </div>
          </div>

          <!-- Stats Row -->
          <div class="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div class="p-2 bg-dash-border/10 rounded">
              <p class="font-bold text-dash-text">{{ profile.user.public_repos }}</p>
              <p class="text-xs text-dash-text-tertiary">Repos</p>
            </div>
            <div class="p-2 bg-dash-border/10 rounded">
              <p class="font-bold text-dash-text">{{ profile.user.followers }}</p>
              <p class="text-xs text-dash-text-tertiary">Followers</p>
            </div>
            <div class="p-2 bg-dash-border/10 rounded">
              <p class="font-bold text-dash-text">{{ totalStarsList[idx]?.toLocaleString() || 0 }}</p>
              <p class="text-xs text-dash-text-tertiary">Stars</p>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="profile.skills.length > 0" class="mt-4">
            <p class="text-sm font-medium text-dash-text-secondary mb-2 flex items-center gap-1">
              <CodeBracketIcon class="w-4 h-4 text-dash-primary" />
              Skills
            </p>
            <div class="space-y-1.5">
              <div v-for="skill in profile.skills.slice(0, 5)" :key="skill.language" class="flex items-center gap-2">
                <span class="text-xs w-20 truncate text-dash-text-secondary">{{ skill.language }}</span>
                <div class="flex-1 h-1.5 bg-dash-border/20 rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-dash-primary" :style="{ width: skill.percentage + '%' }" />
                </div>
                <span class="text-xs text-dash-text-tertiary w-8 text-right">{{ skill.percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Languages Used -->
          <div v-if="topLanguages[idx]?.length" class="mt-3">
            <p class="text-xs font-medium text-dash-text-tertiary mb-1.5">Languages</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="lang in topLanguages[idx]" :key="lang" class="px-2 py-0.5 bg-dash-border/20 text-dash-text-secondary text-xs rounded-full">
                {{ lang }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Table -->
      <div class="bg-dash-card rounded-xl border border-dash-border p-6">
        <h2 class="text-lg font-semibold text-dash-text mb-4 flex items-center gap-2">
          <ArrowTrendingUpIcon class="w-5 h-5 text-dash-primary" />
          Side-by-Side Comparison
        </h2>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-dash-border">
                  <th class="text-left py-2 pr-4 font-medium text-dash-text-tertiary">Metric</th>
                  <th v-for="profile in profiles" :key="profile.user.login" class="text-center py-2 px-3 font-medium text-dash-text-secondary">
                    {{ profile.user.login }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-dash-border/30">
                <tr v-for="metric in [
                  { label: 'Score', values: scoreResults.map(s => s.total), getCell: (idx: number) => scoreResults[idx]?.total ?? 0, format: (v: number) => v.toString(), lowerBetter: false },
                  { label: 'Repositories', values: profiles.map(p => p.user.public_repos), getCell: (idx: number) => profiles[idx]?.user.public_repos ?? 0, format: (v: number) => v.toString(), lowerBetter: false },
                  { label: 'Followers', values: profiles.map(p => p.user.followers), getCell: (idx: number) => profiles[idx]?.user.followers ?? 0, format: (v: number) => v.toLocaleString(), lowerBetter: false },
                  { label: 'Total Stars', values: totalStarsList, getCell: (idx: number) => totalStarsList[idx] ?? 0, format: (v: number) => v.toLocaleString(), lowerBetter: false },
                  { label: 'Avg Stars/Repo', values: avgStars, getCell: (idx: number) => avgStars[idx] ?? 0, format: (v: number) => v.toLocaleString(), lowerBetter: false },
                  { label: 'Activity (3mo)', values: activityRate, getCell: (idx: number) => activityRate[idx] ?? 0, format: (v: number) => `${v}%`, lowerBetter: false },
                  { label: 'Fork Ratio', values: forkRatios, getCell: (idx: number) => forkRatios[idx] ?? 0, format: (v: number) => `${v}%`, lowerBetter: true },
                  { label: 'Account Age', values: accountAge.map(Number), getCell: (idx: number) => accountAge[idx] ?? '0', format: (v: number) => `${v} yrs`, lowerBetter: false },
                ]" :key="metric.label">
                  <td class="py-2 pr-4 text-dash-text-tertiary">{{ metric.label }}</td>
                  <td v-for="(_, idx) in profiles" :key="idx" class="text-center py-2 px-3 relative">
                    <span class="font-semibold text-dash-text">{{ metric.format(metric.values[idx]) }}</span>
                    <TrophyIcon v-if="getWinnerIdxs(metric.values, metric.lowerBetter).includes(idx) && profiles.length > 1"
                      class="w-4 h-4 text-dash-warning inline-block ml-1 -mt-0.5"
                      title="Leader"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 text-dash-text-tertiary">Top Languages</td>
                  <td v-for="(langs, idx) in topLanguages" :key="idx" class="text-center py-2 px-3">
                    <div class="flex flex-wrap justify-center gap-1">
                      <span v-for="lang in langs" :key="lang" class="px-1.5 py-0.5 bg-dash-border/20 text-dash-text-tertiary text-xs rounded">
                        {{ lang }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="py-2 pr-4 text-dash-text-tertiary">Strengths</td>
                  <td v-for="(score, idx) in scoreResults" :key="idx" class="text-center py-2 px-3">
                    <div v-if="score.strengths.length > 0" class="flex flex-wrap justify-center gap-1">
                      <span v-for="s in score.strengths" :key="s" class="px-1.5 py-0.5 bg-dash-success/10 text-dash-success text-xs rounded">
                        {{ s }}
                      </span>
                    </div>
                    <span v-else class="text-dash-text-tertiary text-xs">None</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
  </div>
</template>
