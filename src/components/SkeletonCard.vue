<script setup lang="ts">
defineProps<{
  variant?: 'text' | 'card' | 'avatar' | 'chart' | 'list'
  count?: number
}>()

const variantClasses = {
  text: 'h-4 rounded w-full',
  card: 'rounded-xl border border-dash-border p-4 space-y-3',
  avatar: 'w-12 h-12 rounded-full',
  chart: 'w-64 h-64 rounded-full',
  list: 'h-3 rounded',
} as const
</script>

<template>
  <div class="space-y-3" aria-busy="true">
    <div
      v-for="n in (count || 1)"
      :key="n"
      class="animate-pulse bg-dash-border/20 rounded-xl border border-dash-border"
      :class="variantClasses[(variant || 'text') as keyof typeof variantClasses]"
    >
      <div v-if="variant === 'avatar'" class="w-12 h-12 rounded-full bg-dash-border/30" />
      <div v-else-if="variant === 'chart'" class="w-64 h-64 rounded-full bg-dash-border/30" />
      <div v-else-if="variant === 'card'">
        <div class="p-4 space-y-3">
          <div class="h-5 w-1/3 bg-dash-border/30 rounded" />
          <div class="h-4 w-1/4 bg-dash-border/30 rounded" />
        </div>
      </div>
      <div v-else class="h-4 rounded w-full bg-dash-border/30" />
    </div>
    <div v-if="variant === 'list'" class="space-y-2">
      <div v-for="m in (count || 3)" :key="m" class="h-3 bg-dash-border/30 rounded w-full animate-pulse" />
    </div>
  </div>
</template>
