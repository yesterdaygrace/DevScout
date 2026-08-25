<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowsRightLeftIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'
import EmptyState from './EmptyState.vue'

interface Props {
  comparisons: string[][]
}

const props = withDefaults(defineProps<Props>(), { comparisons: () => [] })
const router = useRouter()
</script>

<template>
  <div class="bg-dash-card rounded-xl border border-dash-border p-5 min-h-[220px] flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-9 h-9 rounded-lg bg-dash-primary/10 flex items-center justify-center flex-shrink-0">
        <ArrowsRightLeftIcon class="w-5 h-5 text-dash-primary" />
      </div>
      <h3 class="text-sm font-semibold text-dash-text-secondary">Compared</h3>
    </div>

    <EmptyState
      v-if="comparisons.length === 0"
      iconName="compare"
      title="No Comparisons Yet"
      description="Compare developers side-by-side."
      :cta="{ label: 'Compare Developers', route: '/compare' }"
    />
    <div v-else class="flex-1 space-y-1.5 overflow-hidden">
      <div
        v-for="(pair, idx) in comparisons"
        :key="idx"
        class="flex items-center justify-between p-2.5 rounded-lg hover:bg-dash-border/10 transition-all duration-150 cursor-pointer"
        @click="router.push('/compare')"
      >
        <div class="flex items-center gap-2 text-sm">
          <span class="text-dash-text font-medium">{{ pair[0] }}</span>
          <span class="text-dash-text-tertiary text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-dash-border/20">VS</span>
          <span class="text-dash-text font-medium">{{ pair[1] }}</span>
        </div>
      </div>
    </div>

    <!-- Primary Action -->
    <button
      @click="router.push('/compare')"
      class="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-dash-primary border border-dash-primary/30 rounded-lg hover:bg-dash-primary/10 transition-all duration-150 flex-shrink-0 cursor-pointer"
    >
      <PlusCircleIcon class="w-3.5 h-3.5" />
      New Comparison
    </button>
  </div>
</template>
