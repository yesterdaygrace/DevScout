<script setup lang="ts">
import { onMounted } from 'vue'
import { useRateLimit } from '../../composables/useRateLimit'

const rateLimit = useRateLimit()

onMounted(() => {
  // Security hygiene: Remove any legacy plaintext PAT accidentally stored in browser localStorage
  if (localStorage.getItem('github_pat')) {
    localStorage.removeItem('github_pat')
  }
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">API Settings</h1>

    <!-- GitHub API Rate Limit Status -->
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

    <!-- Secure Backend Configuration Note -->
    <section class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <h2 class="text-lg font-semibold">Backend Proxy Security</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        To prevent client-side credential leakage and protect personal access tokens from Cross-Site Scripting (XSS),
        DevScout handles all GitHub API authentication securely on the backend server.
      </p>
      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300 space-y-2">
        <p class="font-medium">How to increase API limits:</p>
        <p>
          Set the <code class="font-mono bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">GITHUB_PAT</code> environment variable in your server environment (or Vercel project settings). This raises the GitHub API quota from 60 to 5,000 requests per hour without exposing tokens to the browser.
        </p>
      </div>
    </section>
  </div>
</template>
