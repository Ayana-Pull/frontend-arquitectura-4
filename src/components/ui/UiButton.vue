<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'md' | 'sm'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
})
</script>

<template>
  <button
    class="ui-button"
    :class="[`ui-button--${variant}`, `ui-button--${size}`, { 'ui-button--block': block, 'is-loading': loading }]"
    :type="type"
    :disabled="disabled"
    :aria-busy="loading || undefined"
  >
    <span class="ui-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--control-height);
  padding-inline: var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  user-select: none;
  touch-action: manipulation;
  overflow: hidden;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-press),
    box-shadow var(--duration-base) var(--ease-out);
}

.ui-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.ui-button--sm {
  height: 2.25rem;
  padding-inline: var(--space-3);
  font-size: var(--text-sm);
}

.ui-button--block {
  width: 100%;
}

.ui-button:active:not(:disabled) {
  transform: scale(0.98);
  transition-duration: var(--duration-instant);
}

.ui-button:disabled {
  cursor: not-allowed;
}

.ui-button.is-loading {
  cursor: progress;
}

.ui-button--primary {
  background: var(--color-ink);
  color: var(--color-on-ink);
  box-shadow: var(--shadow-field);
}

.ui-button--ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.ui-button--outline {
  border-color: var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
}

@media (hover: hover) {
  .ui-button--primary:hover:not(:disabled) {
    background: var(--color-ink-hover);
    box-shadow: var(--shadow-raised);
  }

  .ui-button--outline:hover:not(:disabled) {
    background: var(--color-surface);
  }

  .ui-button--ghost:hover:not(:disabled) {
    color: var(--color-text);
    background: var(--color-surface);
  }
}

.ui-button--primary:disabled:not(.is-loading) {
  opacity: 0.4;
}

.ui-button--ghost:disabled,
.ui-button--outline:disabled {
  opacity: 0.45;
}
</style>
