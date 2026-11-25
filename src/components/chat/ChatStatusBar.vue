<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useTenantStore } from '@/stores/tenant'
import { formatElapsed, STATUS_LABELS } from '@/utils/execution'

/** The footer in the system's voice: tenant, conversation, the running execution and the connection. */
const props = defineProps<{ now: number }>()

const chat = useChatStore()
const tenant = useTenantStore()

const running = computed(() => {
  const item = chat.active
  return item ? `${STATUS_LABELS[item.status]} · ${formatElapsed(props.now - item.startedAt)}` : null
})
</script>

<template>
  <div class="status">
    <span class="status__item">{{ tenant.id }}</span>
    <span v-if="chat.conversation" class="status__item" :title="`Conversación ${chat.conversation.id}`">
      conversación {{ chat.conversation.id.slice(0, 8) }}
    </span>
    <span v-else class="status__item">conversación nueva</span>
    <span v-if="chat.sending" class="status__item status__item--live">enviando…</span>
    <span v-else-if="running" class="status__item status__item--live tabular">{{ running }}</span>
    <span v-if="chat.reconnecting" class="status__item status__item--warning">sin conexión · reintentando</span>
    <span class="status__item status__item--end" title="La API aún no guarda el historial: se conserva solo en esta pestaña.">
      historial en esta pestaña
    </span>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-3);
  margin-top: var(--space-3);
  padding-inline: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.status__item + .status__item:not(.status__item--end)::before {
  content: '·';
  margin-right: var(--space-3);
}

.status__item--end {
  margin-left: auto;
}

.status__item--live {
  color: var(--color-text-muted);
  animation: breathe 1.2s var(--ease-in-out) infinite alternate;
}

.status__item--warning {
  color: var(--color-danger);
}

@keyframes breathe {
  to {
    opacity: 0.45;
  }
}

@media (max-width: 480px) {
  .status__item--end {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status__item--live {
    animation: none;
  }
}
</style>
