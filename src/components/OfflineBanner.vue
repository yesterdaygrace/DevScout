<script setup lang="ts">
import { watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useOfflineDetection } from '../composables/useOfflineDetection'

const { isOnline } = useOfflineDetection()
const dismissed = ref(false)
const route = useRoute()
let dismissTimer: ReturnType<typeof setTimeout> | null = null

function clearDismissTimer() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

watch(isOnline, (online) => {
  clearDismissTimer()
  if (online) {
    // Coming back online — briefly show "back online" then hide
    dismissed.value = false
    dismissTimer = setTimeout(() => {
      dismissed.value = true
      dismissTimer = null
    }, 3000)
  } else {
    // Going offline — always show
    dismissed.value = false
  }
})

// Dismiss "back online" pill immediately when navigating
watch(() => route.path, () => {
  if (isOnline.value) {
    clearDismissTimer()
    dismissed.value = true
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="!dismissed" :key="isOnline ? 'online' : 'offline'">
      <!-- Offline: full banner -->
      <div
        v-if="!isOnline"
        class="w-full px-4 py-3 text-sm font-medium text-center bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        role="alert"
        aria-live="polite"
      >
        <div class="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 12.728L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
          You are offline. Some features may not work.
          <button
            @click="dismissed = true"
            class="ml-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss offline warning"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Back online: small green pill -->
      <div
        v-else
        class="fixed bottom-4 right-4 z-50 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-full shadow-lg"
      >
        Back online
      </div>
    </div>
  </Transition>
</template>
