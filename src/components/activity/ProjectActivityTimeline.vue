<script setup lang="ts">
import { ref } from 'vue'
import type { RepoContribution, RecentProjectActivity } from '../../types/github'
import {
  GlobeAltIcon,
  ClockIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  externalContributions: RepoContribution[]
  ownedContributions: RepoContribution[]
  recentProjects: RecentProjectActivity[]
}

const props = defineProps<Props>()

type Tab = 'external' | 'recent' | 'owned'
const currentTab = ref<Tab>('external')

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
    <!-- Header with Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-headline text-white flex items-center gap-2">
          <GlobeAltIcon class="w-5 h-5 text-white/50" />
          Repository contribution history & recent work
        </h3>
        <p class="text-xs text-white/40 mt-1">
          Differentiates external open-source collaboration from solo/owned projects
        </p>
      </div>

      <div class="flex items-center gap-1 p-1 bg-white/[0.05] border border-white/10 rounded-full text-xs">
        <button
          @click="currentTab = 'external'"
          :class="currentTab === 'external' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>External Org Contributions</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="currentTab === 'external' ? 'bg-black/10' : 'bg-white/10'">
            {{ externalContributions.length }}
          </span>
        </button>
        <button
          @click="currentTab = 'recent'"
          :class="currentTab === 'recent' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Recent Work (90d)</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="currentTab === 'recent' ? 'bg-black/10' : 'bg-white/10'">
            {{ recentProjects.length }}
          </span>
        </button>
        <button
          @click="currentTab = 'owned'"
          :class="currentTab === 'owned' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'"
          class="px-3.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Owned Active</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px]" :class="currentTab === 'owned' ? 'bg-black/10' : 'bg-white/10'">
            {{ ownedContributions.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Tab 1: External Open-Source Contributions -->
    <div v-if="currentTab === 'external'" class="space-y-3">
      <div
        v-if="externalContributions.length === 0"
        class="text-center py-10 text-sm text-white/30 border border-dashed border-white/10 rounded-[var(--radius-md)]"
      >
        No third-party open-source repository contributions recorded in recent public activity.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="repo in externalContributions"
          :key="repo.repo"
          class="p-4 rounded-[var(--radius-md)] bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
        >
          <div>
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {{ repo.owner }}
              </span>
              <span v-if="repo.stargazersCount" class="flex items-center gap-1 text-xs text-amber-300/80">
                <StarIcon class="w-3.5 h-3.5 text-amber-400" />
                {{ repo.stargazersCount.toLocaleString() }}
              </span>
            </div>

            <a
              :href="repo.url"
              target="_blank"
              rel="noopener"
              class="text-sm font-semibold text-white hover:text-emerald-300 transition-colors mt-2 block truncate"
            >
              {{ repo.repo }}
            </a>

            <p v-if="repo.description" class="text-xs text-white/50 line-clamp-2 mt-1">
              {{ repo.description }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-white/40">
            <div class="flex items-center gap-3">
              <span v-if="repo.commitCount"><strong>{{ repo.commitCount }}</strong> commits</span>
              <span v-if="repo.prCount"><strong>{{ repo.prCount }}</strong> PRs</span>
            </div>
            <a
              :href="repo.url"
              target="_blank"
              rel="noopener"
              class="hover:text-white flex items-center gap-1"
            >
              View repo <ArrowTopRightOnSquareIcon class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Recent Project Activity (90 Days) -->
    <div v-else-if="currentTab === 'recent'" class="space-y-2">
      <div
        v-if="recentProjects.length === 0"
        class="text-center py-10 text-sm text-white/30 border border-dashed border-white/10 rounded-[var(--radius-md)]"
      >
        No recent activity detected in the last 90 days.
      </div>

      <div
        v-for="item in recentProjects"
        :key="item.repo"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <ClockIcon class="w-4 h-4 text-emerald-400" />
          </div>
          <div class="min-w-0">
            <a
              :href="item.url"
              target="_blank"
              rel="noopener"
              class="text-sm font-medium text-white hover:underline truncate block"
            >
              {{ item.repo }}
            </a>
            <div class="flex items-center gap-3 text-xs text-white/40 mt-0.5">
              <span v-if="item.commitCount > 0">{{ item.commitCount }} commits</span>
              <span v-if="item.prCount > 0">{{ item.prCount }} PRs</span>
              <span>Touched {{ formatTimeAgo(item.lastActive) }}</span>
            </div>
          </div>
        </div>

        <a
          :href="item.url"
          target="_blank"
          rel="noopener"
          class="text-xs text-white/50 hover:text-white flex items-center gap-1 shrink-0"
        >
          Open <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
        </a>
      </div>
    </div>

    <!-- Tab 3: Owned Active Projects -->
    <div v-else class="space-y-3">
      <div
        v-if="ownedContributions.length === 0"
        class="text-center py-10 text-sm text-white/30 border border-dashed border-white/10 rounded-[var(--radius-md)]"
      >
        No personal active repositories recorded.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="repo in ownedContributions"
          :key="repo.repo"
          class="p-4 rounded-[var(--radius-md)] bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-2"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
                Personal Repository
              </span>
              <span v-if="repo.stargazersCount" class="flex items-center gap-1 text-xs text-amber-300/80">
                <StarIcon class="w-3.5 h-3.5 text-amber-400" />
                {{ repo.stargazersCount.toLocaleString() }}
              </span>
            </div>
            <a
              :href="repo.url"
              target="_blank"
              rel="noopener"
              class="text-sm font-semibold text-white hover:text-emerald-300 transition-colors mt-2 block truncate"
            >
              {{ repo.repo }}
            </a>
            <p v-if="repo.description" class="text-xs text-white/50 line-clamp-2 mt-1">
              {{ repo.description }}
            </p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-white/40">
            <span>{{ repo.commitCount || 0 }} commits recorded</span>
            <a :href="repo.url" target="_blank" rel="noopener" class="hover:text-white flex items-center gap-1">
              View <ArrowTopRightOnSquareIcon class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
