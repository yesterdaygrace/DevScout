import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'system'

function getSystemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'system') return getSystemPrefersDark()
  return mode === 'dark'
}

export const useUiStore = defineStore('ui', () => {
  const themeMode = useLocalStorage<ThemeMode>('theme-mode', 'system')
  const isDark = ref(resolveIsDark(themeMode.value))

  function applyTheme(mode: ThemeMode) {
    const dark = resolveIsDark(mode)
    isDark.value = dark
    document.documentElement.classList.toggle('dark', dark)
  }

  // Initial apply
  applyTheme(themeMode.value)

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (themeMode.value === 'system') {
        applyTheme('system')
      }
    })
  }

  watch(themeMode, (val) => {
    applyTheme(val)
  })

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
  }

  function toggleDarkMode() {
    if (themeMode.value === 'system') {
      setTheme('dark')
    } else if (themeMode.value === 'dark') {
      setTheme('light')
    } else {
      setTheme('system')
    }
  }

  return { isDark, themeMode, setTheme, toggleDarkMode }
})
