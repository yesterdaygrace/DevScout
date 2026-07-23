<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'card' | 'chart' | 'list'
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 1,
})

const nArray = computed(() => Array.from({ length: props.count }, (_, i) => i))
</script>

<template>
  <div v-if="type === 'card'" class="space-y-3">
    <div v-for="n in nArray" :key="n" class="animate-pulse">
      <div class="bg-dash-border/30 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-dash-border/40" />
          <div class="w-12 h-4 rounded-full bg-dash-border/40" />
        </div>
        <div class="h-7 w-16 bg-dash-border/40 rounded mb-2" />
        <div class="h-3 w-20 bg-dash-border/30 rounded" />
        <div class="h-3 w-14 bg-dash-border/20 rounded mt-1" />
      </div>
    </div>
  </div>

  <div v-else-if="type === 'chart'" class="animate-pulse h-full">
    <div class="h-full bg-dash-border/20 rounded-lg flex items-center justify-center">
      <div class="w-3/4 h-3/4 bg-dash-border/30 rounded-full" />
    </div>
  </div>

  <div v-else-if="type === 'list'" class="space-y-2">
    <div v-for="n in nArray" :key="n" class="animate-pulse">
      <div class="flex items-center gap-3 p-3 bg-dash-border/20 rounded-lg">
        <div class="w-8 h-8 rounded-full bg-dash-border/40" />
        <div class="flex-1">
          <div class="h-4 w-24 bg-dash-border/40 rounded mb-1" />
          <div class="h-3 w-16 bg-dash-border/30 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>
