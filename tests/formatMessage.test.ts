import { describe, expect, it } from 'vitest'
import { formatMessage } from '@/utils/formatMessage'

describe('formatMessage', () => {
  it('splits paragraphs and keeps bold and inline code', () => {
    expect(formatMessage('Hola **mundo**\n\nUsa `npm test`')).toEqual([
      { kind: 'paragraph', inline: [{ kind: 'text', text: 'Hola ' }, { kind: 'strong', text: 'mundo' }] },
      { kind: 'paragraph', inline: [{ kind: 'text', text: 'Usa ' }, { kind: 'code', text: 'npm test' }] },
    ])
  })

  it('reads code fences, also unclosed ones', () => {
    expect(formatMessage('```php\necho 1;\n```')).toEqual([{ kind: 'code', lang: 'php', code: 'echo 1;' }])
    expect(formatMessage('```\nsin cerrar')).toEqual([{ kind: 'code', lang: '', code: 'sin cerrar' }])
  })

  it('reads headings and groups list items', () => {
    const blocks = formatMessage('## Plan\n- api\n- web\n1. leer\n2. escribir')

    expect(blocks.map(block => block.kind)).toEqual(['heading', 'list', 'list'])
    expect(blocks[1]).toMatchObject({ ordered: false, items: [[{ text: 'api' }], [{ text: 'web' }]] })
    expect(blocks[2]).toMatchObject({ ordered: true })
  })

  it('never produces HTML: tags stay as text', () => {
    expect(formatMessage('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'paragraph', inline: [{ kind: 'text', text: '<img src=x onerror=alert(1)>' }] },
    ])
  })
})
