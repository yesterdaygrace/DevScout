import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
  createdAt: number
}

const MAX_TOASTS = 5
const DEFAULT_DURATION = 4000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function addToast(type: ToastType, message: string, duration = DEFAULT_DURATION) {
    if (!message) return

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const toast: Toast = { id, type, message, duration, createdAt: Date.now() }

    // Remove oldest if at capacity
    while (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift()
    }

    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(message: string, duration?: number) { addToast('success', message, duration) }
  function error(message: string, duration?: number) { addToast('error', message, duration) }
  function info(message: string, duration?: number) { addToast('info', message, duration) }
  function warning(message: string, duration?: number) { addToast('warning', message, duration) }

  return { toasts, addToast, removeToast, success, error, info, warning }
})
