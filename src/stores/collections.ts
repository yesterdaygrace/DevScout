import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import { useAuthStore } from './auth'
import { logger } from '../utils/debug'
import { useToastStore } from './toast'

export interface CollectionMember {
  id: string
  collection_id: string
  github_username: string
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  created_at: string
  members?: CollectionMember[]
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<Collection[]>([])
  const loading = ref(false)

  function toast() { return useToastStore() }

  async function fetch() {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'fetch skipped — no user'); return }

    loading.value = true
    logger.info('COLLECTIONS', 'fetch', { userId: auth.user.id })
    
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    
    if (collectionsError) {
      logger.error('COLLECTIONS', 'fetch failed', collectionsError)
      loading.value = false
      return
    }

    if (collectionsData) {
      const { data: membersData, error: membersError } = await supabase
        .from('collection_members')
        .select('*')
        .in('collection_id', collectionsData.map(c => c.id))
        .order('created_at', { ascending: false })

      if (membersError) {
        logger.error('COLLECTIONS', 'fetch members failed', membersError)
      }

      collections.value = collectionsData.map(collection => ({
        ...collection,
        members: membersData?.filter(m => m.collection_id === collection.id) || []
      }))
      
      logger.info('COLLECTIONS', 'fetch OK', { count: collectionsData.length })
    }
    
    loading.value = false
  }

  async function create(name: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'create skipped — no user'); return }

    logger.info('COLLECTIONS', 'create', { name })
    const { error } = await supabase
      .from('collections')
      .insert({ user_id: auth.user.id, name })
    
    if (error) {
      logger.error('COLLECTIONS', 'create failed', error, { name })
      toast().error(`Failed to create collection "${name}"`)
      return
    }
    
    toast().success(`Collection "${name}" created`)
    await fetch()
  }

  async function rename(id: string, name: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'rename skipped — no user'); return }

    logger.info('COLLECTIONS', 'rename', { id, name })
    const { error } = await supabase
      .from('collections')
      .update({ name })
      .eq('id', id)
      .eq('user_id', auth.user.id)
    
    if (error) {
      logger.error('COLLECTIONS', 'rename failed', error, { id, name })
      toast().error('Failed to rename collection')
      return
    }
    
    toast().success('Collection renamed')
    await fetch()
  }

  async function remove(id: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'remove skipped — no user'); return }

    logger.info('COLLECTIONS', 'remove', { id })
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)
    
    if (error) {
      logger.error('COLLECTIONS', 'remove failed', error, { id })
      toast().error('Failed to delete collection')
      return
    }
    
    toast().success('Collection deleted')
    await fetch()
  }

  async function addMember(collectionId: string, githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'addMember skipped — no user'); return }

    logger.info('COLLECTIONS', 'addMember', { collectionId, githubUsername })
    const { error } = await supabase
      .from('collection_members')
      .insert({ collection_id: collectionId, github_username: githubUsername })
    
    if (error) {
      logger.error('COLLECTIONS', 'addMember failed', error, { collectionId, githubUsername })
      toast().error(`Failed to add ${githubUsername} to collection`)
      return
    }
    
    toast().success(`${githubUsername} added to collection`)
    await fetch()
  }

  async function duplicate(id: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'duplicate skipped — no user'); return }

    const original = collections.value.find(c => c.id === id)
    if (!original) { toast().error('Collection not found'); return }

    logger.info('COLLECTIONS', 'duplicate', { id, name: original.name })
    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: auth.user.id, name: `${original.name} (copy)` })
      .select()
      .single()

    if (error || !data) {
      logger.error('COLLECTIONS', 'duplicate failed', error, { id })
      toast().error('Failed to duplicate collection')
      return
    }

    if (original.members && original.members.length > 0) {
      const memberInserts = original.members.map(m => ({
        collection_id: data.id,
        github_username: m.github_username,
      }))
      const { error: memberError } = await supabase
        .from('collection_members')
        .insert(memberInserts)

      if (memberError) {
        logger.error('COLLECTIONS', 'duplicate members failed', memberError)
      }
    }

    toast().success(`Collection duplicated as "${data.name}"`)
    await fetch()
  }

  async function removeMember(collectionId: string, githubUsername: string) {
    const auth = useAuthStore()
    if (!auth.user) { logger.warn('COLLECTIONS', 'removeMember skipped — no user'); return }

    logger.info('COLLECTIONS', 'removeMember', { collectionId, githubUsername })
    const { error } = await supabase
      .from('collection_members')
      .delete()
      .eq('collection_id', collectionId)
      .eq('github_username', githubUsername)
    
    if (error) {
      logger.error('COLLECTIONS', 'removeMember failed', error, { collectionId, githubUsername })
      toast().error(`Failed to remove ${githubUsername} from collection`)
      return
    }
    
    toast().success(`${githubUsername} removed from collection`)
    await fetch()
  }

  return { collections, loading, fetch, create, rename, remove, duplicate, addMember, removeMember }
})
