import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, ApiError } from '@/api/client'
import { isTerminal } from '@/api/types'
import type { AcceptedMessage, Conversation, Execution, ExecutionStatus } from '@/api/types'
import { uniqueId } from '@/utils/browser'
import { readJson, writeJson } from '@/utils/storage'

/**
 * One conversation with the agent. A message is accepted with 202 and runs
 * as an execution in pi-service; until Laravel pushes events (T17), the
 * execution is polled until it reaches a terminal status.
 *
 * The API has no message history yet, so the thread is kept in this tab's
 * sessionStorage: a reload keeps it, a new tab or another device does not.
 */
export type ChatItem =
  | { kind: 'user', id: string, text: string }
  | {
    kind: 'assistant'
    id: string
    executionId: string
    status: ExecutionStatus
    result: string | null
    error: string | null
    startedAt: number
    finishedAt: number | null
  }
  | { kind: 'notice', id: string, tone: 'info' | 'error', text: string }

export type AssistantItem = Extract<ChatItem, { kind: 'assistant' }>

interface StoredChat {
  conversation: Conversation | null
  items: ChatItem[]
}

const MAX_TITLE = 80
const FAST_POLL_MS = 1000
const SLOW_POLL_MS = 2500
const FAST_POLL_FOR_MS = 15_000

export const useChatStore = defineStore('chat', () => {
  const conversation = ref<Conversation | null>(null)
  const items = ref<ChatItem[]>([])
  const draft = ref('')
  const sending = ref(false)
  const reconnecting = ref(false)
  let storageKey: string | null = null
  /** Bumped on reset so pollers of a previous conversation stop. */
  let generation = 0
  const polling = new Set<string>()

  const active = computed(() => items.value.findLast((item): item is AssistantItem => item.kind === 'assistant' && !isTerminal(item.status)) ?? null)
  const busy = computed(() => sending.value || active.value !== null)
  const isEmpty = computed(() => items.value.length === 0)

  function persist(): void {
    if (storageKey) writeJson('session', storageKey, { conversation: conversation.value, items: items.value } satisfies StoredChat)
  }

  /** Loads this user's thread from the tab and resumes executions still running. */
  function open(userId: number): void {
    const key = `orquestador-chat:${userId}`
    if (storageKey === key) return
    reset()
    storageKey = key
    const saved = readJson<StoredChat>('session', key)
    conversation.value = saved?.conversation ?? null
    items.value = saved?.items ?? []
    for (const item of items.value) {
      if (item.kind === 'assistant' && !isTerminal(item.status)) poll(item.id)
    }
  }

  function reset(): void {
    generation += 1
    polling.clear()
    conversation.value = null
    items.value = []
    draft.value = ''
    sending.value = false
    reconnecting.value = false
    storageKey = null
  }

  function startNew(): void {
    if (busy.value) return
    const key = storageKey
    reset()
    storageKey = key
    persist()
  }

  function notice(text: string, tone: 'info' | 'error' = 'error'): void {
    items.value.push({ kind: 'notice', id: uniqueId(), tone, text })
  }

  async function ensureConversation(text: string): Promise<Conversation> {
    if (conversation.value) return conversation.value
    const response = await api<{ data: Conversation }>('conversations', { method: 'POST', body: { title: toTitle(text) } })
    conversation.value = response.data
    return response.data
  }

  async function send(raw: string): Promise<void> {
    const text = raw.trim()
    if (!text || busy.value) return

    sending.value = true
    const userItem: ChatItem = { kind: 'user', id: uniqueId(), text }
    items.value.push(userItem)
    draft.value = ''

    try {
      const target = await ensureConversation(text)
      const accepted = await api<{ data: AcceptedMessage }>(`conversations/${target.id}/messages`, { method: 'POST', body: { message: text } })
      addAssistant(accepted.data.execution_id, accepted.data.status)
    }
    catch (error) {
      onSendFailed(error, userItem.id, text)
    }
    finally {
      sending.value = false
      persist()
    }
  }

  function addAssistant(executionId: string, status: ExecutionStatus, error: string | null = null): void {
    const item: AssistantItem = { kind: 'assistant', id: uniqueId(), executionId, status, result: null, error, startedAt: Date.now(), finishedAt: isTerminal(status) ? Date.now() : null }
    items.value.push(item)
    if (!isTerminal(status)) poll(item.id)
  }

  /**
   * A 503 recorded the execution (failed): the message stays with its error.
   * Anything else never started one: the message goes back to the composer.
   */
  function onSendFailed(error: unknown, userItemId: string, text: string): void {
    const apiError = error instanceof ApiError ? error : new ApiError(500, 'No se pudo enviar el mensaje.')

    if (apiError.status === 503 && typeof apiError.body.execution_id === 'string') {
      addAssistant(apiError.body.execution_id, 'failed', apiError.message)
      return
    }

    items.value = items.value.filter(item => item.id !== userItemId)
    draft.value = text
    if (apiError.status === 404) conversation.value = null
    if (apiError.status !== 401) notice(apiError.status === 404 ? 'La conversación ya no existe. Se creará una nueva al enviar.' : apiError.message)
  }

  function findAssistant(id: string): AssistantItem | undefined {
    return items.value.find((item): item is AssistantItem => item.kind === 'assistant' && item.id === id)
  }

  function apply(item: AssistantItem, execution: Execution): void {
    item.status = execution.status
    item.result = execution.result
    item.error = execution.error
    if (isTerminal(execution.status) && !item.finishedAt) item.finishedAt = Date.now()
  }

  async function poll(itemId: string): Promise<void> {
    const item = findAssistant(itemId)
    if (!item || polling.has(item.executionId)) return
    polling.add(item.executionId)
    const runGeneration = generation

    while (runGeneration === generation && !isTerminal(item.status)) {
      await sleep(Date.now() - item.startedAt < FAST_POLL_FOR_MS ? FAST_POLL_MS : SLOW_POLL_MS)
      if (runGeneration !== generation) return
      if (!await refresh(item)) break
    }
    polling.delete(item.executionId)
    persist()
  }

  /** One status check; false stops polling (session ended or execution gone). */
  async function refresh(item: AssistantItem): Promise<boolean> {
    try {
      const response = await api<{ data: Execution }>(`executions/${item.executionId}`)
      reconnecting.value = false
      apply(item, response.data)
      persist()
      return true
    }
    catch (error) {
      if (!(error instanceof ApiError) || error.isOffline || error.status >= 500) {
        reconnecting.value = true
        return true
      }
      if (error.status === 404) {
        apply(item, { ...asExecution(item), status: 'failed', error: error.message })
      }
      return false
    }
  }

  async function cancel(): Promise<void> {
    const item = active.value
    if (!item || item.status === 'cancelling') return
    try {
      const response = await api<{ data: Execution }>(`executions/${item.executionId}/cancel`, { method: 'POST' })
      apply(item, response.data)
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 403) await refresh(item)
      else if (error instanceof ApiError) notice(error.message)
    }
    persist()
  }

  return { conversation, items, draft, sending, reconnecting, active, busy, isEmpty, open, reset, startNew, send, cancel }
})

function asExecution(item: AssistantItem): Execution {
  return { id: item.executionId, tenant_id: '', user_id: 0, conversation_id: '', status: item.status, result: item.result, error: item.error }
}

/** The first words of the message, without Markdown marks, as the conversation title. */
export function toTitle(text: string): string {
  const plain = text.replace(/```[\s\S]*?(```|$)/g, ' ').replace(/[#*`>_~]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > MAX_TITLE ? `${plain.slice(0, MAX_TITLE - 1).trimEnd()}…` : plain || 'Conversación'
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
