<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import UiIcon from '@/components/ui/UiIcon.vue'

/**
 * The prompt box. While an execution runs the conversation is busy (Laravel
 * answers 403 to a second message), so the draft can be written but not sent;
 * Esc or the stop button cancels the execution.
 */
const MAX_LENGTH = 20_000
const WARN_FROM = 18_000

const props = defineProps<{ busy: boolean, cancelling: boolean }>()
const emit = defineEmits<{ send: [text: string], stop: [] }>()
const draft = defineModel<string>({ required: true })

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')

const length = computed(() => [...draft.value].length)
const tooLong = computed(() => length.value > MAX_LENGTH)
const canSend = computed(() => draft.value.trim().length > 0 && !props.busy && !tooLong.value)
const placeholder = computed(() => props.busy
  ? 'Pi está trabajando. Puedes escribir el siguiente mensaje…'
  : 'Escribe a Pi qué hacer en tus repositorios…')

function submit(): void {
  if (canSend.value) emit('send', draft.value)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.isComposing) return
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
  else if (event.key === 'Escape' && props.busy) {
    event.preventDefault()
    emit('stop')
  }
}

// Browsers without `field-sizing: content`: the box grows with the text by hand.
watch(draft, async () => {
  const el = textarea.value
  if (!el || CSS.supports('field-sizing', 'content')) return
  await nextTick()
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}, { flush: 'post' })

defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <form class="composer" :class="{ 'is-busy': busy }" @submit.prevent="submit">
    <label class="sr-only" for="chat-prompt">Mensaje para Pi</label>
    <textarea
      id="chat-prompt"
      ref="textarea"
      v-model="draft"
      class="composer__input"
      rows="1"
      :placeholder="placeholder"
      autocomplete="off"
      @keydown="onKeydown"
    />

    <div class="composer__bar">
      <p class="composer__hint">
        <template v-if="length >= WARN_FROM">
          <span class="tabular" :class="{ 'is-over': tooLong }">{{ length.toLocaleString('es') }} / {{ MAX_LENGTH.toLocaleString('es') }}</span>
        </template>
        <template v-else>
          <kbd>Enter</kbd> enviar · <kbd>Shift</kbd> + <kbd>Enter</kbd> nueva línea<template v-if="busy"> · <kbd>Esc</kbd> detener</template>
        </template>
      </p>

      <div class="composer__buttons">
        <Transition name="pop">
          <button
            v-if="busy"
            type="button"
            class="composer__stop"
            :disabled="cancelling"
            :aria-label="cancelling ? 'Deteniendo' : 'Detener a Pi'"
            @click="emit('stop')"
          >
            <UiIcon name="stop" :size="16" />
          </button>
        </Transition>
        <button type="submit" class="composer__send" :disabled="!canSend" aria-label="Enviar">
          <UiIcon name="arrow-up" :size="18" />
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.composer {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-3) var(--space-2) var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  background: var(--color-field);
  box-shadow: var(--shadow-raised);
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
}

.composer:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-raised), 0 0 0 4px var(--color-selection);
}

.composer__input {
  width: 100%;
  min-height: 1.6em;
  max-height: 40vh;
  padding: var(--space-1) 0;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  font-size: max(16px, var(--text-base));
  line-height: 1.6;
  caret-color: var(--color-text);
  field-sizing: content;
}

.composer__input::placeholder {
  color: var(--color-text-subtle);
}

.composer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.composer__hint {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.composer__hint kbd {
  padding: 0 0.3em;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.9em;
}

.composer__hint .is-over {
  color: var(--color-danger);
}

.composer__buttons {
  display: flex;
  gap: var(--space-2);
}

.composer__send,
.composer__stop {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-press),
    background-color var(--duration-fast) var(--ease-out);
}

.composer__send {
  border: 0;
  background: var(--color-ink);
  color: var(--color-on-ink);
}

.composer__stop {
  border: 1px solid var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text);
}

.composer__send:disabled,
.composer__stop:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.composer__send:active:not(:disabled),
.composer__stop:active:not(:disabled) {
  transform: scale(0.92);
}

@media (hover: hover) {
  .composer__send:hover:not(:disabled) {
    background: var(--color-ink-hover);
  }

  .composer__stop:hover:not(:disabled) {
    background: var(--color-surface);
  }
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out),
    filter var(--duration-fast) var(--ease-out);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
  filter: blur(3px);
}

@media (max-width: 480px) {
  .composer__hint {
    visibility: hidden;
  }
}
</style>
