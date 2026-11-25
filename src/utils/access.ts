import type { AccessAction, AccessLevel, RepositoryAccessRow } from '@/api/types'

/**
 * What a user can do on one repository, from its access rows. Mirrors
 * RepositoryAccessPolicy in Laravel: an action on a path is allowed when any
 * row allows the action and covers the path (null paths = whole repository).
 * Repositories blocked by a user "none" row never reach the frontend.
 */
export interface ActionScope {
  action: AccessAction
  /** null = the whole repository; otherwise the union of granted paths. */
  paths: string[] | null
}

const LEVEL_RANK: Record<AccessLevel, number> = { none: 0, viewer: 1, editor: 2 }
const ACTIONS: readonly AccessAction[] = ['read', 'write', 'execute']

export function highestLevel(rows: RepositoryAccessRow[]): AccessLevel {
  return rows.reduce<AccessLevel>((best, row) => LEVEL_RANK[row.level] > LEVEL_RANK[best] ? row.level : best, 'none')
}

export function actionScopes(rows: RepositoryAccessRow[]): ActionScope[] {
  return ACTIONS.flatMap((action): ActionScope[] => {
    const granting = rows.filter(row => row.actions.includes(action))
    if (!granting.length) return []
    if (granting.some(row => row.paths === null)) return [{ action, paths: null }]

    return [{ action, paths: [...new Set(granting.flatMap(row => row.paths ?? []))].sort() }]
  })
}

export const LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'sin acceso',
  viewer: 'lector',
  editor: 'editor',
}

export const ACTION_LABELS: Record<AccessAction, string> = {
  read: 'leer',
  write: 'escribir',
  execute: 'ejecutar',
}
