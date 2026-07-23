<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPreview = ref(false)

const tags = defineModel<string[]>('tags', { default: [] })
const newTag = ref('')

function addTag() {
  const tag = newTag.value.trim().toLowerCase()
  if (tag && !tags.value.includes(tag)) {
    tags.value = [...tags.value, tag]
    newTag.value = ''
  }
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(t => t !== tag)
}

// Simple Markdown to HTML conversion
function renderMarkdown(text: string): string {
  if (!text) return '<p class="text-gray-400 italic">No content</p>'
  
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto text-sm my-2"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 hover:underline">$1</a>')
    // Newlines to <br>
    .replace(/\n/g, '<br />')
  
  return html
}

const previewHtml = computed(() => renderMarkdown(props.modelValue))
</script>

<template>
  <div class="space-y-2">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <div class="flex gap-1">
        <button
          @click="showPreview = false"
          class="px-3 py-1 text-xs rounded-t transition-colors"
          :class="!showPreview ? 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'"
        >
          Write
        </button>
        <button
          @click="showPreview = true"
          class="px-3 py-1 text-xs rounded-t transition-colors"
          :class="showPreview ? 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'"
        >
          Preview
        </button>
      </div>
      <span class="text-xs text-gray-400">Supports **bold**, *italic*, `code`, [links](url)</span>
    </div>

    <!-- Editor / Preview -->
    <textarea
      v-if="!showPreview"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :placeholder="placeholder || 'Write notes using Markdown...'"
      :rows="rows || 4"
      class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-y"
    />
    <div
      v-else
      class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[100px] prose prose-sm dark:prose-invert max-w-none"
      v-html="previewHtml"
    />

    <!-- Tags -->
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in tags"
        :key="tag"
        class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full"
      >
        {{ tag }}
        <button @click="removeTag(tag)" class="hover:text-red-500" aria-label="Remove tag">&times;</button>
      </span>
      <div class="flex gap-1">
        <input
          v-model="newTag"
          @keydown.enter.prevent="addTag"
          @keydown.comma.prevent="addTag"
          placeholder="Add tag..."
          class="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded-full bg-transparent w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  </div>
</template>
