export interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private readonly ttlMs: number
  private readonly maxSize: number

  constructor(ttlMs = 5 * 60 * 1000, maxSize = 100) {
    this.ttlMs = ttlMs
    this.maxSize = maxSize
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: T): void {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value
      if (oldest) this.store.delete(oldest)
    }
    this.store.set(key, { data, expiresAt: Date.now() + this.ttlMs })
  }

  invalidate(key: string): void { this.store.delete(key) }

  invalidateAll(): void { this.store.clear() }

  get size(): number { return this.store.size }
}
