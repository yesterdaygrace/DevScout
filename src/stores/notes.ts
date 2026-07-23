import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import type { Note } from '../types/domain'
import { useAuthStore } from './auth'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const activeTagFilter = ref<string | null>(null)

  function toast() { return useToastStore() }

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    for (const note of notes.value) {
      for (const tag of note.tags || []) {
        tagSet.add(tag)
      }
    }
    return [...tagSet].sort()
  })

  const filteredNotes = computed(() => {
    let result = notes.value
    if (activeTagFilter.value) {
      result = result.filter(n => (n.tags || []).includes(activeTagFilter.value!))
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(
        n =>
          n.github_username.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.tags || []).some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  })

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setTagFilter(tag: string | null) {
    activeTagFilter.value = tag
  }

  async function fetch() {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('NOTES', 'fetch skipped — no user'); return }

    loading.value = true
    logger.info('NOTES', 'fetch', { userId: auth.user.id })
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false })
    if (error) logger.error('NOTES', 'fetch failed', error)
    if (data) { notes.value = data; logger.info('NOTES', 'fetch OK', { count: data.length }) }
    loading.value = false
  }

  async function upsert(githubUsername: string, content: string, tags: string[] = []) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('NOTES', 'upsert skipped — no user'); return }

    const existing = notes.value.find(n => n.github_username === githubUsername)
    const action = existing ? 'update' : 'insert'
    logger.info('NOTES', action, { githubUsername, contentLength: content.length, tags })

    let result
    if (existing) {
      result = await supabase
        .from('notes')
        .update({ content, tags, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      result = await supabase
        .from('notes')
        .insert({ user_id: auth.user.id, github_username: githubUsername, content, tags })
    }

    if (result.error) {
      logger.error('NOTES', `${action} failed`, result.error, { githubUsername })
      toast().error(`Failed to save note for ${githubUsername}`)
      return
    }
    toast().success(`Note saved for ${githubUsername}`)
    await fetch()
  }

  async function remove(githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('NOTES', 'remove skipped — no user'); return }

    logger.info('NOTES', 'remove', { githubUsername })
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('user_id', auth.user.id)
      .eq('github_username', githubUsername)
    if (error) {
      logger.error('NOTES', 'remove failed', error, { githubUsername })
      toast().error(`Failed to delete note for ${githubUsername}`)
      return
    }
    toast().success(`Note deleted for ${githubUsername}`)
    await fetch()
  }

  function getNote(username: string): Note | undefined {
    return notes.value.find(n => n.github_username === username)
  }

  return { notes, loading, fetch, upsert, remove, getNote, searchQuery, activeTagFilter, allTags, filteredNotes, setSearchQuery, setTagFilter }
})
