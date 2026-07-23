<script setup lang="ts">
interface CTA {
  label: string
  route: string
}

interface Props {
  icon?: string
  title: string
  description?: string
  cta?: CTA | null
}

withDefaults(defineProps<Props>(), {
  icon: '📭',
  description: '',
  cta: null,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8 px-4 text-center">
    <span class="text-3xl mb-3">{{ icon }}</span>
    <h4 class="text-sm font-semibold text-dash-text mb-1">{{ title }}</h4>
    <p v-if="description" class="text-xs text-dash-muted max-w-xs">{{ description }}</p>
    <router-link
      v-if="cta"
      :to="cta.route"
      class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover transition-all duration-150"
    >
      {{ cta.label }}
    </router-link>
  </div>
</template>
