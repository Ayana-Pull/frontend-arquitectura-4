import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, ApiError } from '@/api/client'
import { apiLocation } from '@/api/config'

/**
 * The tenant this domain opens (GET /api/tenant, public). Everything else in
 * the app waits for it: on a central domain or an unknown one there is no
 * tenant to log in to.
 */
export type TenantState = 'loading' | 'ready' | 'central' | 'not-found' | 'offline'

export const useTenantStore = defineStore('tenant', () => {
  const state = ref<TenantState>('loading')
  const id = ref<string | null>(null)
  const hostname = apiLocation.hostname

  async function load(): Promise<void> {
    if (apiLocation.isCentral) {
      state.value = 'central'
      return
    }

    state.value = 'loading'
    try {
      const response = await api<{ data: { id: string } }>('tenant')
      id.value = response.data.id
      state.value = 'ready'
    }
    catch (error) {
      state.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'offline'
    }
  }

  return { state, id, hostname, load }
})
