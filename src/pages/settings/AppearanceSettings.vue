<script setup lang="ts">
import { useUiStore } from '../../stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">Appearance</h1>

    <section class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 class="text-lg font-semibold">Theme</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Choose how DevScout looks for you.</p>

      <div class="grid grid-cols-3 gap-3">
        <button
          @click="ui.setTheme('light')"
          class="p-4 rounded-lg border-2 text-center transition-all"
          :class="ui.themeMode === 'light'
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
        >
          <div class="w-full h-20 rounded-md bg-white border border-gray-200 mb-2 flex items-center justify-center">
            <SunIcon class="w-8 h-8 text-amber-500" />
          </div>
          <span class="text-sm font-medium">Light</span>
        </button>

        <button
          @click="ui.setTheme('dark')"
          class="p-4 rounded-lg border-2 text-center transition-all"
          :class="ui.themeMode === 'dark'
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
        >
          <div class="w-full h-20 rounded-md bg-gray-900 border border-gray-700 mb-2 flex items-center justify-center">
            <MoonIcon class="w-8 h-8 text-indigo-400" />
          </div>
          <span class="text-sm font-medium">Dark</span>
        </button>

        <button
          @click="ui.setTheme('system')"
          class="p-4 rounded-lg border-2 text-center transition-all"
          :class="ui.themeMode === 'system'
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
        >
          <div class="w-full h-20 rounded-md bg-gradient-to-br from-white to-gray-900 border border-gray-200 dark:border-gray-700 mb-2 flex items-center justify-center">
            <ComputerDesktopIcon class="w-8 h-8 text-gray-500" />
          </div>
          <span class="text-sm font-medium">System</span>
        </button>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
        Current: <span class="font-medium capitalize">{{ ui.themeMode }}</span>
        {{ ui.themeMode === 'system' ? `(detected: ${ui.isDark ? 'dark' : 'light'})` : '' }}
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
export default { components: { SunIcon, MoonIcon, ComputerDesktopIcon } }
</script>
