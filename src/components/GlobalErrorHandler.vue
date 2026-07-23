<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import ErrorMessage from './ErrorMessage.vue'

const hasError = ref(false)
const error = ref<Error | null>(null)

function reset() {
  hasError.value = false
  error.value = null
}

onErrorCaptured((err) => {
  hasError.value = true
  error.value = err instanceof Error ? err : new Error(String(err))
  console.error('[GlobalErrorHandler]', err)
  return false
})
</script>

<template>
  <ErrorMessage
    v-if="hasError"
    title="Something went wrong"
    :message="error?.message || 'An unexpected error occurred'"
    :retry="reset"
  />
  <router-view v-else />
</template>
