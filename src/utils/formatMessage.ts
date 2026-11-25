/**
 * Minimal Markdown for agent answers, rendered without raw HTML:
 * ```code``` blocks, # headings, - and 1. lists, paragraphs, **bold** and `inline code`.
 * An unclosed code fence is still shown as code.
 */
export type InlineToken = { kind: 'text' | 'strong' | 'code', text: string }
export type Block =
  | { kind: 'paragraph', inline: InlineToken[] }
  | { kind: 'heading', level: 1 | 2 | 3, inline: InlineToken[] }
  | { kind: 'list', ordered: boolean, items: InlineToken[][] }
  | { kind: 'code', lang: string, code: string }

const FENCE = /```(\w*)\n?([\s\S]*?)(```|$)/g
const HEADING = /^(#{1,3})\s+(.*)$/
const BULLET = /^\s*[-*]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/

export function formatMessage(source: string): Block[] {
  const blocks: Block[] = []
  let cursor = 0

  for (const match of source.matchAll(FENCE)) {
    pushText(blocks, source.slice(cursor, match.index))
    blocks.push({ kind: 'code', lang: match[1] ?? '', code: (match[2] ?? '').replace(/\n$/, '') })
    cursor = match.index + match[0].length
  }
  pushText(blocks, source.slice(cursor))
  return blocks
}

function pushText(blocks: Block[], text: string): void {
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.join('').trim()) blocks.push({ kind: 'paragraph', inline: parseInline(paragraph.join('\n').trim()) })
    paragraph = []
  }

  for (const line of text.split('\n')) {
    const heading = HEADING.exec(line)
    const item = BULLET.exec(line) ?? NUMBERED.exec(line)

    if (heading) {
      flush()
      blocks.push({ kind: 'heading', level: heading[1]!.length as 1 | 2 | 3, inline: parseInline(heading[2]!.trim()) })
    }
    else if (item) {
      flush()
      pushListItem(blocks, NUMBERED.test(line), parseInline(item[1]!.trim()))
    }
    else if (!line.trim()) {
      flush()
    }
    else {
      paragraph.push(line)
    }
  }
  flush()
}

function pushListItem(blocks: Block[], ordered: boolean, item: InlineToken[]): void {
  const last = blocks.at(-1)
  if (last?.kind === 'list' && last.ordered === ordered) {
    last.items.push(item)
    return
  }
  blocks.push({ kind: 'list', ordered, items: [item] })
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g
  let cursor = 0

  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) tokens.push({ kind: 'text', text: text.slice(cursor, match.index) })
    tokens.push(match[1] !== undefined ? { kind: 'strong', text: match[1] } : { kind: 'code', text: match[2]! })
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) tokens.push({ kind: 'text', text: text.slice(cursor) })
  return tokens
}
