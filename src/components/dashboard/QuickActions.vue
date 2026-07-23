<script setup lang="ts">
import { MagnifyingGlassIcon, FolderPlusIcon, ArrowsRightLeftIcon, DocumentPlusIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'

const emit = defineEmits<{
  action: [type: string]
}>()

const router = useRouter()

const actions = [
  { id: 'search', label: 'Search Developer', icon: MagnifyingGlassIcon, color: 'indigo' },
  { id: 'collection', label: 'Create Collection', icon: FolderPlusIcon, color: 'emerald' },
  { id: 'compare', label: 'Compare Developers', icon: ArrowsRightLeftIcon, color: 'amber' },
  { id: 'note', label: 'Create Note', icon: DocumentPlusIcon, color: 'violet' },
  { id: 'import', label: 'Import Username', icon: UserPlusIcon, color: 'cyan' },
]

function handleClick(id: string) {
  emit('action', id)
  const routes: Record<string, string> = {
    search: '/search',
    collection: '/collections',
    compare: '/compare',
    note: '/notes-search',
    import: '/search',
  }
  if (routes[id]) router.push(routes[id])
}

function handleImport() {
  const name = prompt('Enter GitHub username:')
  if (name?.trim()) router.push(`/profile/${name.trim()}`)
}

const colorClasses: Record<string, { bg: string; icon: string; hoverBg: string }> = {
  indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', hoverBg: 'hover:bg-indigo-500/15' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', hoverBg: 'hover:bg-emerald-500/15' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', hoverBg: 'hover:bg-amber-500/15' },
  violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', hoverBg: 'hover:bg-violet-500/15' },
  cyan: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/15' },
}
</script>

<template>
  <div class="bg-dash-surface rounded-xl border border-dash-border/60 p-4">
    <h3 class="text-sm font-semibold text-dash-text mb-3">Quick Actions</h3>
    <div class="flex flex-col gap-2">
      <button
        v-for="act in actions"
        :key="act.id"
        class="group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-dash-border/40 bg-dash-border/5 hover:border-dash-primary/30 transition-all duration-200"
        :class="colorClasses[act.color]?.hoverBg"
        @click="act.id === 'import' ? handleImport() : handleClick(act.id)"
      >
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
          :class="colorClasses[act.color]?.bg"
        >
          <component :is="act.icon" class="w-5 h-5 transition-transform duration-200 group-hover:scale-110" :class="colorClasses[act.color]?.icon" />
        </div>
        <span class="text-sm font-medium text-dash-text group-hover:text-dash-primary transition-colors duration-150">{{ act.label }}</span>
      </button>
    </div>
  </div>
</template>
