<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import Toast from './Toast.vue'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <Toast
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        v-bind="toast"
        @dismiss="toastStore.removeToast"
        class="pointer-events-auto"
      />
    </TransitionGroup>
  </div>
</template>
