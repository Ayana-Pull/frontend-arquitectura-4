<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import UiIcon from './UiIcon.vue'

const props = withDefaults(defineProps<{
  label: string
  type?: 'text' | 'email' | 'password'
  error?: string
  autocomplete?: string
  inputmode?: 'text' | 'email'
  placeholder?: string
  disabled?: boolean
}>(), {
  type: 'text',
  error: '',
  autocomplete: 'off',
  inputmode: 'text',
  placeholder: '',
  disabled: false,
})

const model = defineModel<string>({ required: true })
const emit = defineEmits<{ blur: [] }>()

const id = useId()
const errorId = `${id}-error`
const capsId = `${id}-caps`

const input = useTemplateRef<HTMLInputElement>('input')
defineExpose({ focus: () => input.value?.focus() })

const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const inputType = computed(() => (isPassword.value && revealed.value ? 'text' : props.type))

const capsLock = ref(false)
function trackCapsLock(event: KeyboardEvent) {
  if (isPassword.value && typeof event.getModifierState === 'function') {
    capsLock.value = event.getModifierState('CapsLock')
  }
}

// Conserva el último mensaje para que la salida anime con texto, no vacía.
const shownError = ref(props.error)
watch(() => props.error, (value) => {
  if (value) shownError.value = value
})

const describedBy = computed(() => [
  props.error ? errorId : null,
  capsLock.value ? capsId : null,
].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="field" :class="{ 'has-error': !!error, 'is-disabled': disabled }">
    <label class="field__label" :for="id">{{ label }}</label>

    <div class="field__control">
      <input
        :id="id"
        ref="input"
        v-model="model"
        class="field__input"
        :type="inputType"
        :name="id"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="!!error || undefined"
        :aria-describedby="describedBy"
        autocapitalize="off"
        spellcheck="false"
        @keydown="trackCapsLock"
        @keyup="trackCapsLock"
        @blur="capsLock = false; emit('blur')"
      >

      <button
        v-if="isPassword"
        type="button"
        class="field__reveal"
        :aria-label="revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="revealed"
        :disabled="disabled"
        @click="revealed = !revealed"
      >
        <Transition name="reveal-icon">
          <span :key="revealed ? 'off' : 'on'" class="field__reveal-icon">
            <UiIcon :name="revealed ? 'eye-off' : 'eye'" />
          </span>
        </Transition>
      </button>
    </div>

    <div class="field__reveal-row" :class="{ 'is-open': capsLock }">
      <div class="field__clip">
        <p :id="capsId" class="field__note">
          <UiIcon name="caps" :size="14" />
          Bloq Mayús está activado
        </p>
      </div>
    </div>

    <div class="field__reveal-row" :class="{ 'is-open': !!error }">
      <div class="field__clip">
        <p :id="errorId" class="field__note field__note--error" role="alert">
          <UiIcon name="alert" :size="14" />
          {{ shownError }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: grid;
}

.field__label {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.field__control {
  position: relative;
}

.field__input {
  width: 100%;
  height: var(--control-height);
  padding-inline: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-field);
  box-shadow: var(--shadow-field);
  font-size: max(16px, var(--text-base));
  caret-color: var(--color-text);
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
}

.field__input::placeholder {
  color: var(--color-text-subtle);
}

.field__input[type='password'],
.field__control:has(.field__reveal) .field__input {
  padding-right: calc(var(--control-height) + var(--space-1));
}

@media (hover: hover) {
  .field__input:hover:not(:focus):not(:disabled) {
    border-color: var(--gray-400);
    background: var(--color-field-hover);
  }

  :global(.dark) .field__input:hover:not(:focus):not(:disabled) {
    border-color: var(--gray-600);
  }
}

.field__input:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-field), 0 0 0 4px var(--color-selection);
}

.has-error .field__input {
  border-color: var(--color-danger);
}

.has-error .field__input:focus {
  box-shadow: var(--shadow-field), 0 0 0 4px var(--color-danger-soft);
}

.field__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Autocompletado del navegador: se mantiene dentro de la paleta. */
.field__input:-webkit-autofill {
  -webkit-text-fill-color: var(--color-text);
  -webkit-box-shadow: 0 0 0 100px var(--color-surface) inset;
  transition: background-color 9999s;
}

.field__reveal {
  position: absolute;
  inset-block: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: var(--control-height);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-subtle);
  transition: color var(--duration-fast) var(--ease-out);
}

.field__reveal-icon {
  display: grid;
  place-items: center;
  grid-area: 1 / 1;
}

@media (hover: hover) {
  .field__reveal:hover:not(:disabled) {
    color: var(--color-text);
  }
}

.field__reveal:focus-visible {
  outline-offset: -4px;
}

.reveal-icon-enter-active {
  transition:
    opacity 240ms var(--ease-out),
    transform 350ms cubic-bezier(0.34, 1.3, 0.64, 1),
    filter 240ms var(--ease-out);
}

.reveal-icon-leave-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 200ms var(--ease-out),
    filter 160ms var(--ease-out);
}

.reveal-icon-enter-from,
.reveal-icon-leave-to {
  opacity: 0;
  filter: blur(2px);
}

.reveal-icon-enter-from {
  transform: scale(0.6) rotate(-30deg);
}

.reveal-icon-leave-to {
  transform: scale(0.6) rotate(30deg);
}

/* Fila que se abre animando su altura real (0fr → 1fr). */
.field__reveal-row {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    grid-template-rows var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.field__reveal-row.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: none;
}

.field__clip {
  min-height: 0;
  overflow: hidden;
}

.field__note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.field__note--error {
  color: var(--color-danger);
}
</style>
