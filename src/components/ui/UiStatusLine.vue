<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * The system's signature: a mono line with a dot and a lowercase message
 * typed character by character, ending in a blinking block cursor.
 * tone: idle (subtle dot), busy (ink dot, pulsing), done (ink, one pulse), error (danger).
 */
export type StatusTone = 'idle' | 'busy' | 'done' | 'error'

const props = defineProps<{ message: string, tone: StatusTone }>()

const typed = ref(props.message)
let timer: ReturnType<typeof setInterval> | undefined

watch(() => props.message, (next) => {
  clearInterval(timer)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed.value = next
    return
  }
  // A countdown only changes its digits: retyping the whole line would flicker.
  const common = commonPrefix(typed.value, next)
  let index = common
  typed.value = next.slice(0, index)
  timer = setInterval(() => {
    index += 1
    typed.value = next.slice(0, index)
    if (index >= next.length) clearInterval(timer)
  }, 18)
})

function commonPrefix(a: string, b: string): number {
  let index = 0
  while (index < a.length && a[index] === b[index]) index += 1
  return index
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="status" :data-tone="tone">
    <span class="status__dot" aria-hidden="true" />
    <span class="status__text" aria-hidden="true">{{ typed }}<span class="status__caret" /></span>
    <span class="sr-only" aria-live="polite">{{ message }}</span>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 1.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.01em;
  color: var(--color-text-muted);
}

.status__dot {
  position: relative;
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-text-subtle);
  transition: background-color var(--duration-base) var(--ease-out);
}

.status__dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  opacity: 0;
}

[data-tone='busy'] .status__dot,
[data-tone='done'] .status__dot {
  background: var(--color-ink);
}

[data-tone='busy'] .status__dot::after {
  animation: ping 1.1s var(--ease-out) infinite;
}

[data-tone='done'] .status__dot::after {
  animation: ping 0.9s var(--ease-out) 1;
}

[data-tone='done'] .status__text {
  color: var(--color-text);
}

[data-tone='error'] .status__dot {
  background: var(--color-danger);
}

[data-tone='error'] .status__text {
  color: var(--color-danger);
}

.status__text {
  font-variant-numeric: tabular-nums;
}

.status__caret {
  display: inline-block;
  width: 0.55em;
  height: 1.1em;
  margin-left: 2px;
  vertical-align: -0.2em;
  background: currentColor;
  opacity: 0.7;
  animation: blink 1.1s steps(1, end) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
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
  .status__caret,
  .status__dot::after {
    animation: none;
  }
}
</style>
