<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ClockIcon, PlusCircleIcon, EyeIcon } from '@heroicons/vue/24/outline'
import SkeletonCard from './SkeletonCard.vue'
import EmptyState from './EmptyState.vue'

interface ViewedItem {
  id: string
  github_username: string
  viewed_at: string
}

interface Props {
  items: ViewedItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const router = useRouter()

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const displayItems = computed(() => props.items.slice(0, 5))
</script>

<template>
  <div class="bg-dash-card rounded-xl border border-dash-border p-5 min-h-[220px] flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-9 h-9 rounded-lg bg-dash-primary/10 flex items-center justify-center flex-shrink-0">
        <EyeIcon class="w-5 h-5 text-dash-primary" />
      </div>
      <h3 class="text-sm font-semibold text-dash-text-secondary">Recently Viewed</h3>
    </div>

    <div v-if="loading" class="flex-1">
      <SkeletonCard type="list" :count="3" />
    </div>
    <EmptyState
      v-else-if="items.length === 0"
      iconName="eye"
      title="No Profiles Viewed Yet"
      description="Start searching to find developers."
      :cta="{ label: 'Search developers', route: '/search' }"
    />
    <div v-else class="flex-1 space-y-1 overflow-hidden">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="group flex items-center justify-between p-2 rounded-lg hover:bg-dash-border/10 transition-all duration-150 cursor-pointer"
        @click="router.push(`/profile/${item.github_username}`)"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 rounded-full bg-dash-primary/20 flex items-center justify-center text-[11px] font-bold text-dash-primary flex-shrink-0 uppercase">
            {{ item.github_username.charAt(0) }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-dash-text truncate">{{ item.github_username }}</p>
            <p class="text-xs text-dash-text-tertiary">{{ timeAgo(item.viewed_at) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            @click.stop="router.push(`/compare?add=${item.github_username}`)"
            class="p-1 rounded-md text-dash-text-tertiary hover:text-dash-text hover:bg-dash-border/30 transition-all cursor-pointer"
            title="Compare"
          >
            <EyeIcon class="w-3.5 h-3.5" />
          </button>
          <button
            @click.stop="router.push('/collections')"
            class="p-1 rounded-md text-dash-text-tertiary hover:text-dash-text hover:bg-dash-border/30 transition-all cursor-pointer"
            title="Collection"
          >
            <ClockIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Primary Action -->
    <router-link
      v-if="items.length > 0"
      to="/search"
      class="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-dash-text-secondary border border-dash-border rounded-lg hover:bg-dash-border/20 transition-all duration-150 flex-shrink-0 cursor-pointer"
    >
      <PlusCircleIcon class="w-3.5 h-3.5" />
      Search More Developers
    </router-link>
  </div>
</template>
