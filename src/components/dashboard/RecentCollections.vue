<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { FolderIcon, PencilIcon, ArrowDownTrayIcon, PlusIcon } from '@heroicons/vue/24/outline'
import SkeletonCard from './SkeletonCard.vue'
import EmptyState from './EmptyState.vue'

interface CollectionItem {
  id: string
  name: string
  members?: { github_username: string }[]
  created_at: string
}

interface Props {
  collections: CollectionItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })
const router = useRouter()

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const displayCollections = computed(() => props.collections.slice(0, 4))
</script>

<template>
  <div class="bg-dash-surface rounded-xl border border-dash-border/60 p-5 min-h-[220px] flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <FolderIcon class="w-5 h-5 text-amber-500" />
      </div>
      <h3 class="text-sm font-semibold text-dash-text">Collections</h3>
    </div>

    <div v-if="loading" class="flex-1">
      <SkeletonCard type="card" :count="3" />
    </div>
    <EmptyState
      v-else-if="collections.length === 0"
      icon="📂"
      title="No Collections Yet"
      description="Create your first collection."
      :cta="{ label: 'Create Collection', route: '/collections' }"
    />
    <div v-else class="flex-1 space-y-2 overflow-hidden">
      <div
        v-for="col in displayCollections"
        :key="col.id"
        class="group flex items-center justify-between p-2.5 rounded-lg bg-dash-border/10 hover:bg-dash-border/20 transition-all duration-150 cursor-pointer"
        @click="router.push('/collections')"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FolderIcon class="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-dash-text truncate">{{ col.name }}</p>
            <p class="text-xs text-dash-muted">
              {{ col.members?.length || 0 }} devs · {{ timeAgo(col.created_at) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            @click.stop="router.push('/collections')"
            class="p-1.5 rounded-md text-dash-muted hover:text-dash-text hover:bg-dash-border/30 transition-all"
            title="Open"
          >
            <PencilIcon class="w-3.5 h-3.5" />
          </button>
          <button
            @click.stop="router.push('/collections')"
            class="p-1.5 rounded-md text-dash-muted hover:text-dash-text hover:bg-dash-border/30 transition-all"
            title="Export"
          >
            <ArrowDownTrayIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Primary Action -->
    <router-link
      v-if="collections.length > 0"
      to="/collections"
      class="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-all duration-150 flex-shrink-0"
    >
      <PlusIcon class="w-3.5 h-3.5" />
      View All Collections
    </router-link>
  </div>
</template>
