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
  list: 'h-3 rounded w-full',
}
</script>

<template>
  <div class="space-y-3" aria-busy="true">
    <div
      v-for="n in (count || 1)"
      :key="n"
      class="animate-pulse bg-dash-border/30"
      :class="variantClasses[variant || 'text']"
      aria-hidden="true"
      role="presentation"
    />
    <div
      v-if="variant === 'list'"
      v-for="n in (count || 3)"
      :key="'list-' + n"
      class="h-3 bg-dash-border/30 rounded w-full animate-pulse"
      aria-hidden="true"
    />
  </div>
</template>
