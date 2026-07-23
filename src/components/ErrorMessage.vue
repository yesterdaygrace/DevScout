<script setup lang="ts">
defineProps<{
  title?: string
  message: string
  retry?: () => void
}>()
</script>

<template>
  <div class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert" aria-live="assertive">
    <div class="flex items-start gap-3">
      <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
          {{ title || 'Error' }}
        </h3>
        <p class="mt-1 text-sm text-red-600 dark:text-red-400">{{ message }}</p>
        <button
          v-if="retry"
          @click="retry"
          class="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/40 rounded-md hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>
