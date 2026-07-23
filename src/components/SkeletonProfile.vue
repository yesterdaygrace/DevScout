<script setup lang="ts">
import LoadingSkeleton from './LoadingSkeleton.vue'
</script>

<template>
  <div class="space-y-8" aria-busy="true">
    <!-- Profile header -->
    <div class="flex flex-col sm:flex-row items-start gap-6">
      <LoadingSkeleton variant="avatar" class="w-24 h-24" />
      <div class="flex-1 space-y-3">
        <LoadingSkeleton class="w-1/3 h-8" />
        <LoadingSkeleton class="w-1/4 h-4" />
        <LoadingSkeleton class="w-1/2 h-4" />
        <div class="flex gap-4">
          <LoadingSkeleton class="w-20 h-4" />
          <LoadingSkeleton class="w-20 h-4" />
          <LoadingSkeleton class="w-20 h-4" />
        </div>
      </div>
    </div>

    <!-- Skill chart -->
    <div class="flex flex-col sm:flex-row items-center gap-8">
      <LoadingSkeleton variant="chart" class="w-64 h-64" />
      <div class="flex-1 space-y-3 w-full">
        <LoadingSkeleton v-for="n in 6" :key="n" class="h-3" />
      </div>
    </div>

    <!-- Repos -->
    <div class="space-y-3">
      <LoadingSkeleton class="w-1/4 h-6" />
      <LoadingSkeleton variant="card" v-for="n in 3" :key="n" class="space-y-2">
        <LoadingSkeleton class="w-1/3 h-4" />
        <LoadingSkeleton class="w-2/3 h-3" />
      </LoadingSkeleton>
    </div>
  </div>
</template>
