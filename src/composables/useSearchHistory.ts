import { ref } from 'vue'
import type { SearchHistoryItem } from '../types/search'

const STORAGE_KEY = 'search_history'
const MAX_HISTORY = 10
let idCounter = 0

const history = ref<SearchHistoryItem[]>([])

function generateId(): string {
  return `${Date.now()}-${++idCounter}`
}

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      history.value = JSON.parse(stored)
    } else {
      history.value = []
    }
  } catch (e) {
    console.error('Failed to load search history', e)
    history.value = []
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  } catch (e) {
    console.error('Failed to save search history', e)
  }
}

export function useSearchHistory() {
  loadHistory()

  function addToHistory(query: string, filters?: any) {
    if (!query.trim()) return

    const item: SearchHistoryItem = {
      id: generateId(),
      query: query.trim(),
      filters,
      timestamp: new Date().toISOString(),
    }

    // Remove duplicates
    history.value = history.value.filter(h => h.query !== item.query)
    
    // Add to front
    history.value.unshift(item)
    
    // Keep only last MAX_HISTORY items
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY)
    }
    
    saveHistory()
  }

  function clearHistory() {
    history.value = []
    saveHistory()
  }

  function removeFromHistory(id: string) {
    history.value = history.value.filter(h => h.id !== id)
    saveHistory()
  }

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  }
}
