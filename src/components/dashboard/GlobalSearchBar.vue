<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function handleSearch() {
  const q = query.value.trim()
  if (q) {
    router.push(`/search?q=${encodeURIComponent(q)}`)
    query.value = ''
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="relative">
    <div class="relative max-w-2xl">
      <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dash-muted pointer-events-none" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Search developers, collections, notes..."
        class="w-full pl-12 pr-24 py-3 bg-dash-surface border border-dash-border rounded-xl text-sm text-dash-text placeholder-dash-muted/50 focus:outline-none focus:border-dash-primary/50 focus:ring-2 focus:ring-dash-primary/20 transition-all duration-150 shadow-sm"
        @keydown.enter="handleSearch"
      />
      <kbd class="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-medium text-dash-muted bg-dash-border/30 rounded-md border border-dash-border/40 pointer-events-none hidden sm:inline-block">
        ⌘K
      </kbd>
    </div>
  </div>
</template>
