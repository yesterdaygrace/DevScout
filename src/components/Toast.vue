<script setup lang="ts">
import type { ToastType } from '../stores/toast'

const props = defineProps<{
  id: string
  type: ToastType
  message: string
  duration: number
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const icons: Record<ToastType, string> = {
  success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  info: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
}

const colors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  info: 'text-blue-500 dark:text-blue-400',
  warning: 'text-amber-500 dark:text-amber-400',
}
</script>

<template>
  <div
    class="relative w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all"
    :class="colors[type]"
    role="alert"
    aria-live="assertive"
  >
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" :class="iconColors[type]" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" :d="icons[type]" />
      </svg>
      <p class="flex-1 text-sm font-medium">{{ message }}</p>
      <button
        @click="emit('dismiss', props.id)"
        class="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <!-- Progress bar -->
    <div class="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg overflow-hidden">
      <div
        class="h-full rounded-b-lg"
        :class="iconColors[type]"
        :style="{
          animation: `shrink ${duration}ms linear forwards`,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
