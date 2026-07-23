<script setup lang="ts">
defineProps<{
  variant?: 'text' | 'card' | 'avatar' | 'chart'
  count?: number
}>()

const variantClasses = {
  text: 'h-4 rounded w-full',
  card: 'rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3',
  avatar: 'w-12 h-12 rounded-full',
  chart: 'w-64 h-64 rounded-full',
}
</script>

<template>
  <div
    v-for="n in (count || 1)"
    :key="n"
    class="animate-pulse bg-gray-200 dark:bg-gray-700"
    :class="variantClasses[variant || 'text']"
    aria-hidden="true"
    role="presentation"
  />
</template>
