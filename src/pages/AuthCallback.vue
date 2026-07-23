<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()
const status = ref('Completing sign in...')

onMounted(async () => {
  const code = route.query.code as string | null

  if (!code) {
    status.value = 'No authorization code received'
    setTimeout(() => router.push('/login'), 2000)
    return
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      status.value = 'Sign in failed. Redirecting...'
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    status.value = 'Sign in successful! Redirecting...'
    setTimeout(() => router.push('/'), 500)
  } catch (err) {
    console.error('Unexpected error:', err)
    status.value = 'An error occurred. Redirecting...'
    setTimeout(() => router.push('/login'), 2000)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-400">{{ status }}</p>
    </div>
  </div>
</template>
