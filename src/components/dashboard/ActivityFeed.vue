<script setup lang="ts">
import { computed } from 'vue'
import {
  FolderIcon,
  BookmarkIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'
import SkeletonCard from './SkeletonCard.vue'
import EmptyState from './EmptyState.vue'

interface ActivityEvent {
  id: string
  type: 'compare' | 'collection_add' | 'search_save' | 'note_create' | 'shortlist_add' | 'import'
  label: string
  description: string
  timestamp: string
}

interface Props {
  events: ActivityEvent[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const typeConfig: Record<string, { icon: any; color: string }> = {
  compare: { icon: ArrowsRightLeftIcon, color: 'border-l-dash-primary' },
  collection_add: { icon: FolderIcon, color: 'border-l-emerald-500' },
  search_save: { icon: BookmarkIcon, color: 'border-l-amber-500' },
  note_create: { icon: DocumentTextIcon, color: 'border-l-violet-500' },
  shortlist_add: { icon: BookmarkIcon, color: 'border-l-yellow-500' },
  import: { icon: UserPlusIcon, color: 'border-l-cyan-500' },
}

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

const displayEvents = computed(() => props.events.slice(0, 10))
</script>

<template>
  <div class="bg-dash-card rounded-xl border border-dash-border p-5 min-h-[260px] flex flex-col">
    <h3 class="text-sm font-semibold text-dash-text-secondary mb-4">Activity</h3>

    <div v-if="loading" class="flex-1">
      <SkeletonCard type="list" :count="4" />
    </div>
    <EmptyState
      v-else-if="events.length === 0"
      iconName="clipboard"
      title="No Activity Yet"
      description="Your recent actions will appear here."
      :cta="null"
    />
    <div v-else class="flex-1 space-y-0 overflow-hidden">
      <div
        v-for="(evt, idx) in displayEvents"
        :key="evt.id"
      >
        <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-dash-border/10 transition-all duration-150">
          <div class="w-7 h-7 rounded-lg bg-dash-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <component :is="typeConfig[evt.type]?.icon || MagnifyingGlassIcon" class="w-3.5 h-3.5 text-dash-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-dash-text-tertiary">{{ evt.label }}</p>
            <p class="text-sm text-dash-text truncate font-medium">{{ evt.description }}</p>
          </div>
          <span class="text-[11px] text-dash-text-tertiary flex-shrink-0">{{ timeAgo(evt.timestamp) }}</span>
        </div>
        <div v-if="idx < displayEvents.length - 1" class="border-t border-dash-border/20 mx-3" />
      </div>
    </div>
  </div>
</template>
