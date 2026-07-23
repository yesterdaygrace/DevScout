<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDashboardStats } from '../composables/useDashboardStats'
import { useRecentlyViewedStore } from '../stores/recentlyViewed'
import { useShortlistStore } from '../stores/shortlist'
import { useSavedSearchesStore } from '../stores/savedSearches'
import { useSearchHistory } from '../composables/useSearchHistory'

import GreetingSection from '../components/dashboard/GreetingSection.vue'
import KPIGrid from '../components/dashboard/KPIGrid.vue'
import SearchAnalytics from '../components/dashboard/SearchAnalytics.vue'
import LanguageDistribution from '../components/dashboard/LanguageDistribution.vue'
import RecentCollections from '../components/dashboard/RecentCollections.vue'
import RecentlyViewed from '../components/dashboard/RecentlyViewed.vue'
import RecentlyCompared from '../components/dashboard/RecentlyCompared.vue'
import QuickActions from '../components/dashboard/QuickActions.vue'
import ActivityFeed from '../components/dashboard/ActivityFeed.vue'
import InsightsPanel from '../components/dashboard/InsightsPanel.vue'

const {
  kpiMetrics, searchAnalytics,
  languageDistribution,
  collectionsStore,
  insights, activityFeed,
} = useDashboardStats()

const recentlyViewedStore_local = useRecentlyViewedStore()
const shortlistStore = useShortlistStore()
const savedSearchesStore = useSavedSearchesStore()
const { history: searchHistory } = useSearchHistory()

const loading = ref(true)
const recentlyCompared = ref<string[][]>([])

onMounted(async () => {
  await Promise.all([
    recentlyViewedStore_local.fetch(),
    shortlistStore.fetch(),
    savedSearchesStore.fetch(),
    collectionsStore.fetch(),
  ])
  loadRecentlyCompared()
  loading.value = false
})

function loadRecentlyCompared() {
  try {
    const stored = localStorage.getItem('recently_compared')
    if (stored) {
      const raw: string[] = JSON.parse(stored)
      const pairs: string[][] = []
      for (let i = 0; i < raw.length - 1; i += 2) {
        pairs.push([raw[i], raw[i + 1]])
      }
      recentlyCompared.value = pairs.slice(0, 5)
    }
  } catch { /* ignore */ }
}

const lastQuery = searchHistory.value[0]?.query || null

// KPI metrics mapped to component props
const kpiData = [
  { title: 'Searches', value: kpiMetrics.value.searches.total, secondary: `${kpiMetrics.value.searches.today} today`, icon: 'search', trend: kpiMetrics.value.searches.trend, link: '/search', color: 'indigo' },
  { title: 'Collections', value: kpiMetrics.value.collections.total, secondary: `${kpiMetrics.value.collections.totalMembers} candidates`, icon: 'collection', trend: null, link: '/collections', color: 'emerald' },
  { title: 'Shortlisted', value: kpiMetrics.value.shortlisted.total, secondary: `+${kpiMetrics.value.shortlisted.addedToday} today`, icon: 'shortlist', trend: null, link: '/search', color: 'amber' },
  { title: 'Saved Searches', value: kpiMetrics.value.savedSearches.total, secondary: kpiMetrics.value.savedSearches.mostUsed, icon: 'saved', trend: null, link: '/searches', color: 'violet' },
]
</script>

<template>
  <div class="space-y-8">
    <!-- Hero with API Usage in top-right corner -->
    <GreetingSection :username="'Rizky'" :last-query="lastQuery" />

    <!-- KPI Grid (4 cols) -->
    <KPIGrid :metrics="kpiData" :loading="loading" />

    <!-- Workspace: Main Content (70%) + Sticky Sidebar (30%) — entire section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Main Content: charts row + 3 tall cards row below -->
      <div class="lg:col-span-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchAnalytics :data="searchAnalytics" :loading="loading" />
          <LanguageDistribution :data="languageDistribution" :loading="loading" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecentCollections :collections="collectionsStore.collections" :loading="loading" class="min-h-[220px]" />
          <RecentlyViewed :items="recentlyViewedStore_local.items" :loading="loading" class="min-h-[220px]" />
          <RecentlyCompared :comparisons="recentlyCompared" class="min-h-[220px]" />
        </div>
      </div>

      <!-- Right Sidebar: Quick Actions + Activity Feed — sticky -->
      <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start">
        <QuickActions @action="() => {}" />
        <ActivityFeed :events="activityFeed" :loading="loading" />
      </div>
    </div>

    <!-- Bottom Insights: 4 equal cards -->
    <InsightsPanel :data="insights" :loading="loading" />
  </div>
</template>
