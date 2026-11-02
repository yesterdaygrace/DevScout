<script setup lang="ts">
import type { DeveloperActivitySummary } from '../../types/github'
import ContributionHeatmap from './ContributionHeatmap.vue'
import PullRequestAudit from './PullRequestAudit.vue'
import ProjectActivityTimeline from './ProjectActivityTimeline.vue'
import { ArrowPathIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/vue/24/outline'

interface Props {
  username: string
  activity: DeveloperActivitySummary | null
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <section class="space-y-6">
    <!-- Section Title & Subheading -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40">Recruiter Intelligence</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <SparklesIcon class="w-3 h-3" />
            Verified Activity
          </span>
        </div>
        <h2 class="text-section text-white mt-1">Activity & Contribution Patterns</h2>
      </div>
      <p class="text-xs text-white/40 max-w-sm">
        Examines real work, velocity, PR acceptance, and sustained consistency beyond raw repository counts.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-8 space-y-6 animate-pulse">
      <div class="flex items-center justify-between">
        <div class="h-6 w-48 bg-white/10 rounded" />
        <div class="h-6 w-32 bg-white/10 rounded-full" />
      </div>
      <div class="h-28 w-full bg-white/5 rounded-md" />
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="h-20 bg-white/5 rounded-md" />
        <div class="h-20 bg-white/5 rounded-md" />
        <div class="h-20 bg-white/5 rounded-md" />
        <div class="h-20 bg-white/5 rounded-md" />
      </div>
    </div>

    <!-- Error State with Graceful Retry -->
    <div
      v-else-if="error && !activity"
      class="rounded-[var(--radius-lg)] border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-3"
    >
      <div class="flex items-center justify-center gap-2 text-amber-400 font-medium text-sm">
        <ExclamationTriangleIcon class="w-5 h-5" />
        <span>Activity data currently limited</span>
      </div>
      <p class="text-xs text-white/50 max-w-md mx-auto">
        {{ error }} — GitHub API rate limit reached or public profile activity unavailable.
      </p>
      <button
        @click="emit('retry')"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 cursor-pointer transition-colors"
      >
        <ArrowPathIcon class="w-3.5 h-3.5" />
        Retry activity fetch
      </button>
    </div>

    <!-- Activity Content -->
    <div v-else-if="activity" class="space-y-6">
      <!-- 1. 52-Week Commit Heatmap & Consistency -->
      <ContributionHeatmap
        :calendar="activity.calendar"
        :consistency="activity.consistency"
        :has-private-activity-disclaimer="activity.hasPrivateActivityDisclaimer"
      />

      <!-- 2. Pull Request History & Merge Rates -->
      <PullRequestAudit
        :pull-requests="activity.pullRequests"
      />

      <!-- 3. Repository Contributions & 90-Day Active Projects -->
      <ProjectActivityTimeline
        :external-contributions="activity.externalContributions"
        :owned-contributions="activity.ownedContributions"
        :recent-projects="activity.recentProjects"
      />
    </div>
  </section>
</template>
