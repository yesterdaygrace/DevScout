import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSearchHistory } from '../../src/composables/useSearchHistory'

const HISTORY_KEY = 'search_history'

describe('useSearchHistory', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should start with empty history', () => {
    const { history } = useSearchHistory()
    expect(history.value).toEqual([])
  })

  it('should add items to history', () => {
    const { history, addToHistory } = useSearchHistory()
    addToHistory('vue developers', { language: 'Vue' })
    expect(history.value.length).toBeGreaterThanOrEqual(1)
    expect(history.value[0].query).toBe('vue developers')
  })

  it('should not add duplicate query strings', () => {
    const { history, addToHistory } = useSearchHistory()
    addToHistory('react')
    addToHistory('vue')
    addToHistory('vue')
    const vueItems = history.value.filter(h => h.query === 'vue')
    expect(vueItems).toHaveLength(1)
    expect(history.value[0].query).toBe('vue')
  })

  it('should cap at 10 items', () => {
    const { history, addToHistory } = useSearchHistory()
    for (let i = 0; i < 15; i++) {
      addToHistory(`query-${i}`)
    }
    expect(history.value.length).toBeLessThanOrEqual(10)
  })

  it('should persist to localStorage', () => {
    const { addToHistory } = useSearchHistory()
    addToHistory('react')
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    expect(stored.some((s: any) => s.query === 'react')).toBe(true)
  })

  it('should remove items from history', () => {
    const { history, addToHistory, removeFromHistory } = useSearchHistory()
    addToHistory('vue')
    addToHistory('react')
    const idToRemove = history.value.find(h => h.query === 'vue')!.id
    removeFromHistory(idToRemove)
    expect(history.value.some(h => h.query === 'vue')).toBe(false)
    expect(history.value).toHaveLength(1)
    expect(history.value[0].query).toBe('react')
    expect(history.value.some(h => h.query === 'react')).toBe(true)
  })
})
