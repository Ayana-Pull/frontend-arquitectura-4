/**
 * localStorage / sessionStorage that never throws (private mode, blocked
 * storage). Storage is per origin, and each tenant has its own origin
 * (demo.localhost:3000), so tenants never see each other's data.
 */
type Area = 'local' | 'session'

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  }
  catch {
    return null
  }
}

export function readJson<T>(kind: Area, key: string): T | null {
  try {
    const raw = area(kind)?.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  }
  catch {
    return null
  }
}

export function writeJson(kind: Area, key: string, value: unknown): void {
  try {
    if (value === null) area(kind)?.removeItem(key)
    else area(kind)?.setItem(key, JSON.stringify(value))
  }
  catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}
