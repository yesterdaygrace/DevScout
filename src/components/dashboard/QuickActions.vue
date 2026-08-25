<script setup lang="ts">
import { MagnifyingGlassIcon, FolderPlusIcon, ArrowsRightLeftIcon, DocumentPlusIcon, UserPlusIcon } from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'

const emit = defineEmits<{
  action: [type: string]
}>()

const router = useRouter()

const actions = [
  { id: 'search', label: 'Search Developer', icon: MagnifyingGlassIcon },
  { id: 'collection', label: 'Create Collection', icon: FolderPlusIcon },
  { id: 'compare', label: 'Compare Developers', icon: ArrowsRightLeftIcon },
  { id: 'note', label: 'Create Note', icon: DocumentPlusIcon },
  { id: 'import', label: 'Import Username', icon: UserPlusIcon },
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
</script>

<template>
  <div class="bg-dash-card rounded-xl border border-dash-border p-5">
    <h3 class="text-sm font-semibold text-dash-text-secondary mb-3">Quick Actions</h3>
    <div class="flex flex-col gap-2">
      <button
        v-for="act in actions"
        :key="act.id"
        class="group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-dash-border text-dash-text-secondary hover:border-dash-primary/40 hover:text-dash-primary transition-colors cursor-pointer"
        @click="act.id === 'import' ? handleImport() : handleClick(act.id)"
      >
        <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-dash-primary/10">
          <component :is="act.icon" class="w-5 h-5 text-dash-primary" />
        </div>
        <span class="text-sm font-medium">{{ act.label }}</span>
      </button>
    </div>
  </div>
</template>
