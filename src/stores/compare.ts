import { defineStore } from 'pinia'
import { ref } from 'vue'

const RECENTLY_COMPARED_KEY = 'recently_compared'

function loadRecentlyCompared(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_COMPARED_KEY) || '[]')
  } catch { return [] }
}

function saveRecentlyCompared(items: string[]) {
  localStorage.setItem(RECENTLY_COMPARED_KEY, JSON.stringify(items.slice(0, 10)))
}

export const useCompareStore = defineStore('compare', () => {
  const usernames = ref<string[]>([])

  function add(username: string) {
    if (!usernames.value.includes(username) && usernames.value.length < 3) {
      usernames.value.push(username)
    }
    const recent = loadRecentlyCompared()
    if (!recent.includes(username)) {
      recent.unshift(username)
      saveRecentlyCompared(recent)
    }
  }

  function remove(username: string) {
    usernames.value = usernames.value.filter(u => u !== username)
  }

  function clear() {
    usernames.value = []
  }

  function isSelected(username: string): boolean {
    return usernames.value.includes(username)
  }

  return { usernames, add, remove, clear, isSelected }
})
