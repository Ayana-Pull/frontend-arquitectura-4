<script setup lang="ts">
import { computed } from 'vue'
import { formatMessage } from '@/utils/formatMessage'
import type { InlineToken } from '@/utils/formatMessage'
import ChatCodeBlock from './ChatCodeBlock.vue'

/**
 * An agent answer. Answers arrive whole (no streaming yet), so with "reveal"
 * the blocks settle in one after another, like the old live typing.
 */
const props = defineProps<{ text: string, reveal?: boolean }>()

const blocks = computed(() => formatMessage(props.text))

function isText(token: InlineToken): boolean {
  return token.kind === 'text'
}
</script>

<template>
  <div class="markdown" :class="{ 'is-revealing': reveal }">
    <template v-for="(block, b) in blocks" :key="b">
      <ChatCodeBlock v-if="block.kind === 'code'" class="markdown__block" :style="{ '--i': b }" :code="block.code" :lang="block.lang" />

      <component :is="`h${block.level + 2}`" v-else-if="block.kind === 'heading'" class="markdown__block markdown__heading" :style="{ '--i': b }">
        <template v-for="(token, t) in block.inline" :key="t">
          <code v-if="token.kind === 'code'" class="markdown__inline-code">{{ token.text }}</code>
          <template v-else>{{ token.text }}</template>
        </template>
      </component>

      <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.kind === 'list'" class="markdown__block markdown__list" :style="{ '--i': b }">
        <li v-for="(item, i) in block.items" :key="i">
          <template v-for="(token, t) in item" :key="t">
            <strong v-if="token.kind === 'strong'">{{ token.text }}</strong>
            <code v-else-if="token.kind === 'code'" class="markdown__inline-code">{{ token.text }}</code>
            <template v-else-if="isText(token)">{{ token.text }}</template>
          </template>
        </li>
      </component>

      <p v-else class="markdown__block markdown__paragraph" :style="{ '--i': b }">
        <template v-for="(token, t) in block.inline" :key="t">
          <strong v-if="token.kind === 'strong'">{{ token.text }}</strong>
          <code v-else-if="token.kind === 'code'" class="markdown__inline-code">{{ token.text }}</code>
          <template v-else>{{ token.text }}</template>
        </template>
      </p>
    </template>
  </div>
</template>

<style scoped>
.markdown {
  display: grid;
  gap: var(--space-4);
  max-width: 65ch;
  line-height: 1.65;
}

.markdown__paragraph {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.markdown strong {
  font-weight: 600;
}

.markdown__heading {
  margin-top: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}

h3.markdown__heading {
  font-size: var(--text-lg);
}

.markdown__list {
  display: grid;
  gap: var(--space-2);
  padding-left: 1.25rem;
}

.markdown__list li::marker {
  color: var(--color-text-subtle);
}

ol.markdown__list li::marker {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.markdown__inline-code {
  padding: 0.1em 0.35em;
  border-radius: var(--radius-xs);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 0.875em;
}

.is-revealing .markdown__block {
  animation: block-in 520ms var(--ease-out) both;
  animation-delay: calc(min(var(--i, 0), 12) * 70ms);
}

@keyframes block-in {
  from {
    opacity: 0;
    transform: translateY(6px);
    filter: blur(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-revealing .markdown__block {
    animation: fade-in var(--duration-base) linear both;
  }
}
</style>
