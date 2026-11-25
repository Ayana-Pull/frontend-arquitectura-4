import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, ApiError } from '@/api/client'
import type { RepositoryAccess } from '@/api/types'

/** The repositories the user reaches (GET /api/repositories), read fresh each time. */
export const useAccessStore = defineStore('access', () => {
  const repositories = ref<RepositoryAccess[]>([])
  const state = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    state.value = 'loading'
    try {
      const response = await api<{ data: RepositoryAccess[] }>('repositories')
      repositories.value = response.data
      state.value = 'ready'
    }
    catch (caught) {
      error.value = caught instanceof ApiError ? caught.message : 'No se pudieron cargar los accesos.'
      state.value = 'error'
    }
  }

  function reset(): void {
    repositories.value = []
    state.value = 'idle'
    error.value = null
  }

  return { repositories, state, error, load, reset }
})
