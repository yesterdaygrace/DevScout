<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  remaining?: number
  limit?: number
  resetTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  remaining: 60,
  limit: 60,
  resetTime: '',
})

const percentage = computed(() => (props.remaining / props.limit) * 100)

const barColor = computed(() => {
  if (percentage.value > 20) return 'bg-dash-success'
  if (percentage.value > 10) return 'bg-dash-warning'
  return 'bg-dash-danger'
})

const used = computed(() => props.limit - props.remaining)
</script>

<template>
  <div class="bg-dash-surface rounded-xl border border-dash-border/60 p-5 min-h-[120px] flex flex-col">
    <h3 class="text-sm font-semibold text-dash-text mb-3">API Usage</h3>
    <div class="flex items-center justify-between mb-1.5">
      <span class="text-xs text-dash-muted">Used</span>
      <span class="text-xs text-dash-text tabular-nums font-medium">
        {{ used }} / {{ limit }}
      </span>
    </div>
    <div class="h-2 w-full bg-dash-border/20 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="barColor"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <div class="flex items-center justify-between mt-2">
      <span class="text-xs text-dash-muted">{{ remaining }} remaining</span>
      <span v-if="resetTime" class="text-xs text-dash-muted/50">Resets {{ resetTime }}</span>
    </div>
  </div>
</template>
