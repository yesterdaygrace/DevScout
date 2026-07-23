import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce } from '../../src/composables/useDebounce'

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const value = ref('hello')
    const debounced = useDebounce(value, 300)
    expect(debounced.value).toBe('hello')
  })

  it('should update after delay', async () => {
    vi.useFakeTimers()
    const value = ref('hello')
    const debounced = useDebounce(value, 300)

    value.value = 'world'
    await nextTick()
    expect(debounced.value).toBe('hello')

    vi.advanceTimersByTime(300)
    expect(debounced.value).toBe('world')

    vi.useRealTimers()
  })

  it('should debounce multiple rapid changes', async () => {
    vi.useFakeTimers()
    const value = ref('a')
    const debounced = useDebounce(value, 300)

    value.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(100)
    value.value = 'c'
    await nextTick()
    vi.advanceTimersByTime(100)
    value.value = 'd'
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(debounced.value).toBe('a')

    vi.advanceTimersByTime(300)
    expect(debounced.value).toBe('d')

    vi.useRealTimers()
  })
})
