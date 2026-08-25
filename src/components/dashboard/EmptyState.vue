<script setup lang="ts">
import { computed } from 'vue'
import {
  FolderIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  InboxIcon,
} from '@heroicons/vue/24/outline'

interface CTA {
  label: string
  route: string
}

interface Props {
  iconName?: string
  title: string
  description?: string
  cta?: CTA | null
}

const props = withDefaults(defineProps<Props>(), {
  iconName: 'folder',
  description: '',
  cta: null,
})

const iconMap: Record<string, any> = {
  folder: FolderIcon,
  eye: EyeIcon,
  clipboard: ClipboardDocumentIcon,
  compare: ArrowsRightLeftIcon,
  chart: ChartBarIcon,
  inbox: InboxIcon,
}

const IconComponent = computed(() => iconMap[props.iconName] || InboxIcon)
</script>

<template>
  <div class="flex flex-col items-center justify-center py-10 px-4 text-center flex-1">
    <div class="w-14 h-14 rounded-xl bg-dash-border/10 flex items-center justify-center mb-4">
      <component :is="IconComponent" class="w-7 h-7 text-dash-text-tertiary" />
    </div>
    <h4 class="text-sm font-semibold text-dash-text mb-1">{{ title }}</h4>
    <p v-if="description" class="text-xs text-dash-text-tertiary max-w-xs">{{ description }}</p>
    <router-link
      v-if="cta"
      :to="cta.route"
      class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-dash-primary border border-dash-primary rounded-xl hover:bg-dash-primary/10 transition-colors cursor-pointer"
    >
      {{ cta.label }}
    </router-link>
  </div>
</template>
