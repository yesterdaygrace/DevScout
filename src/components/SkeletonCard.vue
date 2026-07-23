<script setup lang="ts">
import LoadingSkeleton from './LoadingSkeleton.vue'
</script>

<template>
  <div class="space-y-3" aria-busy="true">
    <div v-for="n in 5" :key="n" class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <LoadingSkeleton variant="avatar" />
      <div class="flex-1 space-y-2">
        <LoadingSkeleton class="w-1/3" />
        <LoadingSkeleton class="w-2/3" />
      </div>
      <div class="flex gap-2">
        <LoadingSkeleton class="w-8 h-8 rounded" />
        <LoadingSkeleton class="w-8 h-8 rounded" />
      </div>
    </div>
  </div>
</template>
