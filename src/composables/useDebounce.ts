import { ref, watch } from 'vue'

export function useDebounce<T>(value: import('vue').Ref<T>, delay = 300) {
  const debouncedValue = ref(value.value) as import('vue').Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newVal) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}
