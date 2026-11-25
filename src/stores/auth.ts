import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, setApiToken, setUnauthorizedHandler } from '@/api/client'
import type { AccessToken, User } from '@/api/types'
import { readJson, writeJson } from '@/utils/storage'

/**
 * The Sanctum token from POST /api/login. It is per tenant (Laravel looks it
 * up in the tenant's database) and stored per origin, which is per tenant.
 * When it expires or the API answers 401, the session ends and the login
 * explains why.
 */
const STORAGE_KEY = 'orquestador-session'

interface StoredSession {
  token: string
  expiresAt: string | null
  user: User
}

export type SessionEnd = 'expired' | 'logout' | null

export const useAuthStore = defineStore('auth', () => {
  const session = ref<StoredSession | null>(null)
  const endedBecause = ref<SessionEnd>(null)
  let expiryTimer: ReturnType<typeof setTimeout> | undefined

  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => session.value !== null)
  const firstName = computed(() => user.value?.name.split(' ')[0] ?? '')

  function start(next: StoredSession): void {
    session.value = next
    endedBecause.value = null
    setApiToken(next.token)
    writeJson('local', STORAGE_KEY, next)
    scheduleExpiry(next.expiresAt)
  }

  function end(reason: SessionEnd): void {
    clearTimeout(expiryTimer)
    session.value = null
    endedBecause.value = reason
    setApiToken(null)
    writeJson('local', STORAGE_KEY, null)
  }

  function scheduleExpiry(expiresAt: string | null): void {
    clearTimeout(expiryTimer)
    if (!expiresAt) return
    // setTimeout overflows past ~24.8 days; login tokens last hours.
    const delay = Math.min(new Date(expiresAt).getTime() - Date.now(), 2 ** 31 - 1)
    expiryTimer = setTimeout(() => end('expired'), Math.max(delay, 0))
  }

  /** Restores a saved session that has not expired; the API confirms it with /me. */
  async function restore(): Promise<void> {
    const saved = readJson<StoredSession>('local', STORAGE_KEY)
    if (!saved) return
    if (saved.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now()) {
      end('expired')
      return
    }

    start(saved)
    try {
      const response = await api<{ data: User }>('me')
      start({ ...saved, user: response.data })
    }
    catch {
      // A 401 already ended the session; offline keeps the saved one.
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const response = await api<AccessToken>('login', { method: 'POST', body: { email, password } })
    start({ token: response.token, expiresAt: response.expires_at, user: response.user })
    return response.user
  }

  async function logout(): Promise<void> {
    try {
      await api('logout', { method: 'POST' })
    }
    finally {
      end('logout')
    }
  }

  setUnauthorizedHandler(() => end('expired'))

  return { session, user, firstName, isLoggedIn, endedBecause, restore, login, logout }
})
