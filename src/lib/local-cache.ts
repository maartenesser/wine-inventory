import { useMemo, useSyncExternalStore } from 'react'

export interface CachedEntry<T> {
  timestamp: number
  value: T
}

const CACHE_PREFIX = 'wine-ledger:'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function parseEntry<T>(raw: string | null, ttlMs: number): T | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CachedEntry<T>
    if (!parsed?.timestamp) return null
    if (Date.now() - parsed.timestamp > ttlMs) return null
    return parsed.value ?? null
  } catch {
    return null
  }
}

export function readCache<T>(key: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    return parseEntry<T>(window.localStorage.getItem(`${CACHE_PREFIX}${key}`), ttlMs)
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
    listeners.forEach((listener) => listener())
  } catch {
    // Ignore cache write failures (storage quota, private mode, etc.)
  }
}

/**
 * Reads a cached value as an external store. The server render and hydration see
 * `null`, then the client re-renders with the cached value, so no hydration mismatch
 * and no setState inside an effect.
 */
export function useCachedValue<T>(key: string, ttlMs: number): T | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(`${CACHE_PREFIX}${key}`)
      } catch {
        return null
      }
    },
    () => null
  )
  return useMemo(() => parseEntry<T>(raw, ttlMs), [raw, ttlMs])
}
