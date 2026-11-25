<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isTerminal } from '@/api/types'
import UiIcon from '@/components/ui/UiIcon.vue'
import type { ChatItem } from '@/stores/chat'
import { describeError, formatElapsed, STATUS_LABELS } from '@/utils/execution'
import ChatMarkdown from './ChatMarkdown.vue'

/** One entry of the conversation: your message, the agent's execution, or a notice. */
const props = defineProps<{ item: ChatItem, now: number }>()

const assistant = computed(() => props.item.kind === 'assistant' ? props.item : null)
const live = computed(() => assistant.value !== null && !isTerminal(assistant.value.status))
const elapsed = computed(() => {
  const item = assistant.value
  return item ? formatElapsed((item.finishedAt ?? props.now) - item.startedAt) : ''
})

/** Only an answer that arrives while this entry is on screen plays the reveal. */
const reveal = ref(false)
watch(() => assistant.value?.status, (next, previous) => {
  if (next === 'completed' && previous && previous !== 'completed') reveal.value = true
})
</script>

<template>
  <li class="entry" :class="[`entry--${item.kind}`, { 'is-live': live }]">
    <template v-if="item.kind === 'user'">
      <p class="entry__bubble">
        {{ item.text }}
      </p>
    </template>

    <template v-else-if="item.kind === 'assistant'">
      <div class="entry__author">
        <span class="entry__mark" aria-hidden="true" />
        Pi
        <span class="entry__meta tabular">{{ live ? STATUS_LABELS[item.status] : elapsed }}</span>
        <span class="entry__execution" :title="`Ejecución ${item.executionId}`">{{ item.executionId.slice(0, 8) }}</span>
      </div>

      <div v-if="live" class="entry__waiting" role="status">
        <span class="entry__pulse" aria-hidden="true" />
        <span class="tabular">{{ STATUS_LABELS[item.status] }} · {{ elapsed }}</span>
      </div>

      <template v-else-if="item.status === 'completed'">
        <ChatMarkdown v-if="item.result?.trim()" :text="item.result" :reveal="reveal" />
        <p v-else class="entry__note">
          sin respuesta
        </p>
      </template>

      <p v-else-if="item.status === 'cancelled'" class="entry__note">
        respuesta detenida
      </p>
      <p v-else-if="item.status === 'timed_out'" class="entry__note entry__note--error" role="alert">
        <UiIcon name="clock" :size="14" />
        La ejecución superó el tiempo máximo.
      </p>
      <p v-else class="entry__note entry__note--error" role="alert">
        <UiIcon name="alert" :size="14" />
        {{ describeError(item.error) }}
      </p>
    </template>

    <template v-else>
      <div class="entry__notice" :class="`is-${item.tone}`" :role="item.tone === 'error' ? 'alert' : undefined">
        <UiIcon :name="item.tone === 'info' ? 'check' : 'alert'" :size="14" class="entry__notice-icon" />
        <p>{{ item.text }}</p>
      </div>
    </template>
  </li>
</template>

<style scoped>
.entry {
  display: flex;
  flex-direction: column;
  min-width: 0;
  list-style: none;
  animation: entry-in 460ms var(--ease-out) both;
}

.entry--user {
  align-items: flex-end;
  transform-origin: bottom right;
}

.entry__bubble {
  max-width: min(36rem, 85%);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.entry__author {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.entry__meta::before,
.entry__execution::before {
  content: '·';
  margin-right: var(--space-2);
}

.entry__execution {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.entry:hover .entry__execution,
.entry:focus-within .entry__execution {
  opacity: 0.8;
}

.entry__mark {
  width: 0.5rem;
  height: 0.85rem;
  border-radius: var(--radius-hair);
  background: var(--color-ink);
}

.is-live .entry__mark {
  animation: mark-pulse 1.2s var(--ease-in-out) infinite;
}

.entry__waiting {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.entry__pulse {
  position: relative;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-ink);
}

.entry__pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  animation: ping 1.1s var(--ease-out) infinite;
}

.entry__note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.entry__note--error {
  align-items: flex-start;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.entry__note--error :deep(svg) {
  margin-top: 3px;
}

.entry__notice {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.entry__notice.is-error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-color: transparent;
}

.entry__notice-icon {
  margin-top: 3px;
}

@keyframes entry-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    filter: blur(4px);
  }
}

@keyframes mark-pulse {
  50% {
    opacity: 0.35;
  }
}

@keyframes ping {
  from {
    opacity: 0.5;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry {
    animation: fade-in var(--duration-base) linear both;
  }

  .entry__pulse::after,
  .is-live .entry__mark {
    animation: none;
  }
}
</style>
