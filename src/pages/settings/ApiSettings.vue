<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRateLimit } from '../../composables/useRateLimit'

const rateLimit = useRateLimit()
const patInput = ref('')
const savedPat = ref(false)

onMounted(() => {
  const stored = localStorage.getItem('github_pat')
  if (stored) {
    patInput.value = stored
    savedPat.value = true
  }
})

function savePat() {
  const token = patInput.value.trim()
  if (token) {
    localStorage.setItem('github_pat', token)
    savedPat.value = true
    // Reload rate limit info with new token
    setTimeout(() => window.location.reload(), 1000)
  }
}

function clearPat() {
  localStorage.removeItem('github_pat')
  patInput.value = ''
  savedPat.value = false
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">API Settings</h1>

    <!-- GitHub API Token -->
    <section class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 class="text-lg font-semibold">GitHub Personal Access Token</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Add a GitHub PAT to increase your API rate limit from 60 to 5,000 requests per hour.
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          class="text-indigo-600 dark:text-indigo-400 hover:underline"
        >Create a token</a>
        (no scopes needed for public data).
      </p>

      <div class="flex gap-2">
        <input
          v-model="patInput"
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          @click="savePat"
          :disabled="!patInput.trim()"
          class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          v-if="savedPat"
          @click="clearPat"
          class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      <div v-if="savedPat" class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        Token saved. Reload page to apply.
      </div>
    </section>

    <!-- Rate Limit Status -->
    <section class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 class="text-lg font-semibold">GitHub API Usage</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
          <p class="text-2xl font-bold" :class="rateLimit.isLow.value ? 'text-red-500' : 'text-green-500'">
            {{ rateLimit.remaining.value ?? '—' }}
          </p>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p class="text-sm text-gray-500 dark:text-gray-400">Limit</p>
          <p class="text-2xl font-bold">{{ rateLimit.limit.value ?? '—' }}</p>
        </div>
      </div>
      <div v-if="rateLimit.resetAt.value" class="text-sm text-gray-500 dark:text-gray-400">
        Resets {{ new Date(rateLimit.resetAt.value).toLocaleTimeString() }}
      </div>
    </section>
  </div>
</template>
