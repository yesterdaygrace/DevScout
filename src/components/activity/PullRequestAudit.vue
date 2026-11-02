<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PRStats } from '../../types/github'
import {
  ArrowPathRoundedSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  pullRequests: PRStats
}

const props = defineProps<Props>()

type FilterTab = 'all' | 'merged' | 'closed' | 'open'
const activeFilter = ref<FilterTab>('all')

const filteredPRs = computed(() => {
  if (activeFilter.value === 'all') return props.pullRequests.recent
  return props.pullRequests.recent.filter(pr => pr.state === activeFilter.value)
})

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 3600 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}
</script>

<template>
  <div class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 lg:p-8 space-y-6">
    <!-- Section Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-headline text-white flex items-center gap-2">
          <ArrowPathRoundedSquareIcon class="w-5 h-5 text-white/50" />
          Pull request history & merge quality
        </h3>
        <p class="text-xs text-white/40 mt-1">
          Recruiter signal: High merge rates to external orgs demonstrate accepted code review standards
        </p>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1 p-1 bg-white/[0.05] border border-white/10 rounded-full text-xs">
        <button
          @click="activeFilter = 'all'"
          :class="activeFilter === 'all' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3 py-1 rounded-full transition-colors cursor-pointer"
        >
          All ({{ pullRequests.recent.length }})
        </button>
        <button
          @click="activeFilter = 'merged'"
          :class="activeFilter === 'merged' ? 'bg-emerald-500 text-black font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3 py-1 rounded-full transition-colors cursor-pointer"
        >
          Merged ({{ pullRequests.merged }})
        </button>
        <button
          @click="activeFilter = 'closed'"
          :class="activeFilter === 'closed' ? 'bg-rose-500 text-white font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3 py-1 rounded-full transition-colors cursor-pointer"
        >
          Closed ({{ pullRequests.closed }})
        </button>
        <button
          v-if="pullRequests.open > 0"
          @click="activeFilter = 'open'"
          :class="activeFilter === 'open' ? 'bg-blue-500 text-white font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3 py-1 rounded-full transition-colors cursor-pointer"
        >
          Open ({{ pullRequests.open }})
        </button>
      </div>
    </div>

    <!-- Macro Metrics Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 rounded-[var(--radius-md)] bg-white/[0.03] border border-white/10">
        <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/40 mb-1">Total PRs</p>
        <p class="text-2xl font-bold text-white tabular-nums">{{ pullRequests.total }}</p>
        <p class="text-[11px] text-white/40 mt-0.5">Recorded submissions</p>
      </div>

      <div class="p-4 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20">
        <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-emerald-300/70 mb-1">Merge Rate</p>
        <p class="text-2xl font-bold text-emerald-400 tabular-nums">{{ pullRequests.mergeRate }}%</p>
        <p class="text-[11px] text-emerald-300/60 mt-0.5">{{ pullRequests.merged }} merged PRs</p>
      </div>

      <div class="p-4 rounded-[var(--radius-md)] bg-white/[0.03] border border-white/10">
        <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/40 mb-1">Closed / Unmerged</p>
        <p class="text-2xl font-bold text-white/80 tabular-nums">{{ pullRequests.closed }}</p>
        <p class="text-[11px] text-white/40 mt-0.5">Abandoned or rejected</p>
      </div>

      <div class="p-4 rounded-[var(--radius-md)] bg-white/[0.03] border border-white/10">
        <p class="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/40 mb-1">Active / In Review</p>
        <p class="text-2xl font-bold text-sky-400 tabular-nums">{{ pullRequests.open }}</p>
        <p class="text-[11px] text-white/40 mt-0.5">Currently open</p>
      </div>
    </div>

    <!-- Recent PR Feed -->
    <div class="space-y-2">
      <div
        v-if="filteredPRs.length === 0"
        class="text-center py-8 text-sm text-white/30 border border-dashed border-white/10 rounded-[var(--radius-md)]"
      >
        No pull requests matching current filter.
      </div>

      <div
        v-for="pr in filteredPRs"
        :key="pr.id + pr.repo"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/15 transition-all group"
      >
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- State Badge -->
            <span
              v-if="pr.state === 'merged'"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            >
              <CheckCircleIcon class="w-3 h-3" />
              Merged
            </span>
            <span
              v-else-if="pr.state === 'closed'"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30"
            >
              <XCircleIcon class="w-3 h-3" />
              Closed
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30"
            >
              <ClockIcon class="w-3 h-3" />
              Open
            </span>

            <!-- External vs Personal Repo Tag -->
            <span
              v-if="pr.isExternal"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30"
            >
              External Org
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-white/10"
            >
              Personal Project
            </span>

            <!-- Repository Name -->
            <span class="text-xs font-mono text-white/60 truncate">
              {{ pr.repo }}
            </span>
          </div>

          <!-- PR Title -->
          <a
            :href="pr.url"
            target="_blank"
            rel="noopener"
            class="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors block truncate"
          >
            {{ pr.title }}
          </a>
        </div>

        <div class="flex items-center gap-3 shrink-0 text-xs text-white/40">
          <span>{{ formatTimeAgo(pr.mergedAt || pr.closedAt || pr.createdAt) }}</span>
          <a
            :href="pr.url"
            target="_blank"
            rel="noopener"
            class="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white transition-colors"
            title="View PR on GitHub"
          >
            <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
