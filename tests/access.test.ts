import { describe, expect, it } from 'vitest'
import type { RepositoryAccessRow } from '@/api/types'
import { actionScopes, highestLevel } from '@/utils/access'

const viewerByRole: RepositoryAccessRow = { level: 'viewer', actions: ['read'], paths: null, source: 'role', role: 'developer' }
const editorOnSrc: RepositoryAccessRow = { level: 'editor', actions: ['read', 'write', 'execute'], paths: ['src/'], source: 'user', role: null }

describe('repository access summary', () => {
  it('takes the highest level of all rows', () => {
    expect(highestLevel([viewerByRole, editorOnSrc])).toBe('editor')
    expect(highestLevel([viewerByRole])).toBe('viewer')
  })

  it('reads everywhere but writes only inside the paths of the editor row (demo@pull.srl on "web")', () => {
    expect(actionScopes([viewerByRole, editorOnSrc])).toEqual([
      { action: 'read', paths: null },
      { action: 'write', paths: ['src/'] },
      { action: 'execute', paths: ['src/'] },
    ])
  })

  it('joins the paths of several rows that grant the same action', () => {
    const docs: RepositoryAccessRow = { ...editorOnSrc, paths: ['docs/', 'src/'], source: 'role', role: 'qa' }

    expect(actionScopes([editorOnSrc, docs])[1]).toEqual({ action: 'write', paths: ['docs/', 'src/'] })
  })
})
