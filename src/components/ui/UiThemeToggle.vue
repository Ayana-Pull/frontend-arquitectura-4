<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import UiIcon from './UiIcon.vue'

const { isDark, toggle } = useTheme()

function onClick(event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="onClick"
  >
    <Transition name="swap">
      <span :key="isDark ? 'moon' : 'sun'" class="theme-toggle__icon">
        <UiIcon :name="isDark ? 'moon' : 'sun'" />
      </span>
    </Transition>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg);
  color: var(--color-text-muted);
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-press);
}

.theme-toggle__icon {
  display: grid;
  place-items: center;
  grid-area: 1 / 1;
}

@media (hover: hover) {
  .theme-toggle:hover {
    color: var(--color-text);
    border-color: var(--color-border-strong);
  }
}

.theme-toggle:active {
  transform: scale(0.94);
}

.theme-toggle:focus-visible {
  border-radius: var(--radius-full);
}

/* Spring-like swap: the outgoing icon turns away, the incoming one overshoots slightly. */
.swap-enter-active {
  transition:
    opacity 300ms var(--ease-out),
    transform 500ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

.swap-leave-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 300ms var(--ease-out);
}

.swap-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.swap-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}
</style>
