<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { copyText } from '@/utils/browser'

const props = defineProps<{ code: string, lang: string }>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!await copyText(props.code)) return
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <figure class="code">
    <figcaption class="code__bar">
      <span>{{ lang || 'texto' }}</span>
      <button type="button" class="code__copy" :aria-label="copied ? 'Copiado' : 'Copiar código'" @click="copy">
        <Transition name="copy" mode="out-in">
          <span :key="copied ? 'done' : 'copy'" class="code__copy-label">
            <UiIcon :name="copied ? 'check' : 'copy'" :size="14" />
            {{ copied ? 'Copiado' : 'Copiar' }}
          </span>
        </Transition>
      </button>
    </figcaption>
    <pre class="code__body"><code>{{ code }}</code></pre>
  </figure>
</template>

<style scoped>
.code {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.25rem;
  padding-inline: var(--space-3) var(--space-1);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.code__copy {
  display: grid;
  height: 1.75rem;
  padding-inline: var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.code__copy-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  grid-area: 1 / 1;
}

@media (hover: hover) {
  .code__copy:hover {
    color: var(--color-text);
    background: var(--color-bg);
  }
}

.copy-enter-active,
.copy-leave-active {
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out);
}

.copy-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.copy-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.code__body {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  tab-size: 2;
}
</style>
