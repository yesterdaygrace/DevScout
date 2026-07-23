<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">Profile Settings</h1>

    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {{ auth.user?.email?.charAt(0).toUpperCase() || '?' }}
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-gray-100">{{ auth.user?.email || 'Demo User' }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">Signed in {{ auth.user?.created_at ? new Date(auth.user.created_at).toLocaleDateString() : 'via demo mode' }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            :value="auth.user?.email || 'demo@example.com'"
            type="email"
            disabled
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
          />
          <p class="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>
      </div>
    </div>
  </div>
</template>
