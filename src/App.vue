<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useUiStore } from './stores/ui'
import GlobalErrorHandler from './components/GlobalErrorHandler.vue'
import OfflineBanner from './components/OfflineBanner.vue'
import ToastContainer from './components/ToastContainer.vue'
import type {} from './types/router'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()

function updateTitle() {
  const title = route.meta.title
  if (title) {
    document.title = title
  } else if (route.params.username) {
    document.title = `${route.params.username} | DevScout`
  } else {
    document.title = 'DevScout'
  }
}

onMounted(async () => {
  updateTitle()
  try {
    await auth.initialize()
  } catch (e) {
    console.error('[App] Failed to initialize auth', e)
  }
  if (ui.isDark) {
    document.documentElement.classList.add('dark')
  }
})

watch(() => route.path, updateTitle)
</script>

<template>
  <OfflineBanner />
  <GlobalErrorHandler />
  <ToastContainer />
</template>
