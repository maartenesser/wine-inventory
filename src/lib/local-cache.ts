export interface CachedEntry<T> {
  timestamp: number
  value: T
}

const CACHE_PREFIX = 'wine-ledger:'

export function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedEntry<T>
    if (!parsed?.timestamp) return null
    if (Date.now() - parsed.timestamp > ttlMs) return null
    return parsed.value ?? null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    const payload: CachedEntry<T> = {
      timestamp: Date.now(),
      value,
    }
    window.localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload))
  } catch {
    // Ignore cache write failures (storage quota, private mode, etc.)
  }
}
