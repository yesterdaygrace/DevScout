import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCompareStore } from '../../src/stores/compare'

describe('compareStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should start with empty list', () => {
    const store = useCompareStore()
    expect(store.usernames).toEqual([])
  })

  it('should add a username', () => {
    const store = useCompareStore()
    store.add('torvalds')
    expect(store.usernames).toEqual(['torvalds'])
  })

  it('should not add duplicates', () => {
    const store = useCompareStore()
    store.add('torvalds')
    store.add('torvalds')
    expect(store.usernames).toEqual(['torvalds'])
  })

  it('should enforce max 3 limit', () => {
    const store = useCompareStore()
    store.add('user1')
    store.add('user2')
    store.add('user3')
    store.add('user4')
    expect(store.usernames).toHaveLength(3)
    expect(store.usernames).not.toContain('user4')
  })

  it('should remove a username', () => {
    const store = useCompareStore()
    store.add('user1')
    store.add('user2')
    store.remove('user1')
    expect(store.usernames).toEqual(['user2'])
  })

  it('should clear all usernames', () => {
    const store = useCompareStore()
    store.add('user1')
    store.add('user2')
    store.clear()
    expect(store.usernames).toEqual([])
  })

  it('isSelected should return correct boolean', () => {
    const store = useCompareStore()
    expect(store.isSelected('user1')).toBe(false)
    store.add('user1')
    expect(store.isSelected('user1')).toBe(true)
    expect(store.isSelected('user2')).toBe(false)
  })

  it('remove should be safe for non-existent username', () => {
    const store = useCompareStore()
    store.add('user1')
    store.remove('nonexistent')
    expect(store.usernames).toEqual(['user1'])
  })
})
