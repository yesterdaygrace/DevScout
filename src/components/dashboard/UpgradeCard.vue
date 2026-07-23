<script setup lang="ts">
import { SparklesIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-dash-primary/15 via-dash-surface to-dash-border/20 border border-dash-primary/15 p-4 min-h-[120px] flex flex-col justify-center">
    <div class="absolute top-0 right-0 w-24 h-24 bg-dash-primary/8 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
    <div class="relative">
      <div class="flex items-center gap-2 mb-2">
        <SparklesIcon class="w-4 h-4 text-dash-warning" />
        <h3 class="text-sm font-semibold text-dash-text">Upgrade to Pro</h3>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <ul class="flex items-center gap-3 text-[11px] text-dash-muted">
          <li class="flex items-center gap-1">
            <span class="w-1 h-1 rounded-full bg-dash-primary" />
            Analytics
          </li>
          <li class="flex items-center gap-1">
            <span class="w-1 h-1 rounded-full bg-dash-primary" />
            Unlimited collections
          </li>
          <li class="flex items-center gap-1">
            <span class="w-1 h-1 rounded-full bg-dash-primary" />
            CSV Export
          </li>
        </ul>
        <button
          class="ml-auto px-4 py-1.5 text-xs font-medium text-white bg-dash-primary rounded-lg hover:bg-dash-primary-hover transition-all duration-150 shadow-sm shadow-indigo-500/20 hover:shadow-md"
        >
          Upgrade
        </button>
      </div>
    </div>
  </div>
</template>
