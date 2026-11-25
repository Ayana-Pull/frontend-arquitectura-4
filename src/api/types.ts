/**
 * Shapes of the arquitectura-4 /api responses (app/Http/Resources in Laravel).
 */

export interface User {
  id: number
  name: string
  email: string
  tenant_id: string
}

export interface AccessToken {
  token: string
  token_type: 'Bearer'
  expires_at: string | null
  user: User
}

export interface Conversation {
  id: string
  title: string | null
  tenant_id: string
  user_id: number
  created_at: string | null
}

export type ExecutionStatus = 'pending' | 'running' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'timed_out'

export const TERMINAL_STATUSES: readonly ExecutionStatus[] = ['completed', 'failed', 'cancelled', 'timed_out']

export function isTerminal(status: ExecutionStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export interface Execution {
  id: string
  tenant_id: string
  user_id: number
  conversation_id: string
  status: ExecutionStatus
  result: string | null
  error: string | null
}

export interface AcceptedMessage {
  status: ExecutionStatus
  execution_id: string
  conversation_id: string
  user_id: number
  tenant_id: string
}

export type AccessLevel = 'none' | 'viewer' | 'editor'
export type AccessAction = 'read' | 'write' | 'execute'

export interface RepositoryAccessRow {
  level: AccessLevel
  actions: AccessAction[]
  /** Directory prefixes ending in "/" or exact files; null = the whole repository. */
  paths: string[] | null
  source: 'user' | 'role'
  role: string | null
}

export interface RepositoryAccess {
  slug: string
  access: RepositoryAccessRow[]
}
