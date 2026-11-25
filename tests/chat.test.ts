import { describe, expect, it } from 'vitest'
import { toTitle } from '@/stores/chat'

describe('toTitle', () => {
  it('drops Markdown marks and joins lines', () => {
    expect(toTitle('## Hola\nPropón un plan para **api** con `npm test`')).toBe('Hola Propón un plan para api con npm test')
  })

  it('cuts long messages at 80 characters', () => {
    const title = toTitle('a'.repeat(200))

    expect(title).toHaveLength(80)
    expect(title.endsWith('…')).toBe(true)
  })

  it('never sends an empty title', () => {
    expect(toTitle('```\ncódigo\n```')).toBe('Conversación')
  })
})
