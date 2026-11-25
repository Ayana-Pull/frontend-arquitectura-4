<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/api/client'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiStatusLine from '@/components/ui/UiStatusLine.vue'
import type { StatusTone } from '@/components/ui/UiStatusLine.vue'
import UiTextField from '@/components/ui/UiTextField.vue'
import { useNow } from '@/composables/useNow'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

type Status = 'idle' | 'incomplete' | 'submitting' | 'rejected' | 'locked' | 'offline' | 'success'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUCCESS_PAUSE_MS = 650

const auth = useAuthStore()
const tenant = useTenantStore()
const router = useRouter()
const route = useRoute()
const now = useNow(250)

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const status = ref<Status>('idle')
const formError = ref('')
const grantedName = ref('')
const lockedUntil = ref<number | null>(null)

const emailField = useTemplateRef<{ focus: () => void }>('emailField')
const passwordField = useTemplateRef<{ focus: () => void }>('passwordField')
const formEl = useTemplateRef<HTMLFormElement>('formEl')

const secondsLeft = computed(() => lockedUntil.value ? Math.max(0, Math.ceil((lockedUntil.value - now.value) / 1000)) : 0)
const busy = computed(() => status.value === 'submitting' || status.value === 'success')
const locked = computed(() => secondsLeft.value > 0)
const expired = computed(() => auth.endedBecause === 'expired' && status.value === 'idle')

watch(secondsLeft, (left) => {
  if (left === 0 && status.value === 'locked') {
    status.value = 'idle'
    formError.value = ''
    lockedUntil.value = null
  }
})

const statusLine = computed<{ message: string, tone: StatusTone }>(() => {
  switch (status.value) {
    case 'incomplete': return { message: 'faltan datos por completar', tone: 'error' }
    case 'submitting': return { message: `verificando credenciales en ${tenant.id}`, tone: 'busy' }
    case 'rejected': return { message: 'credenciales rechazadas', tone: 'error' }
    case 'locked': return { message: `acceso en pausa · reintenta en ${secondsLeft.value} s`, tone: 'error' }
    case 'offline': return { message: 'servidor no disponible', tone: 'error' }
    case 'success': return { message: `acceso concedido · ${grantedName.value}`, tone: 'done' }
    default: return expired.value
      ? { message: 'sesión expirada · vuelve a entrar', tone: 'idle' }
      : { message: 'esperando credenciales', tone: 'idle' }
  }
})

function validate(field?: 'email' | 'password'): boolean {
  if (!field || field === 'email') {
    errors.email = !form.email.trim() ? 'Escribe tu correo.' : EMAIL.test(form.email.trim()) ? '' : 'Ese correo no es válido.'
  }
  if (!field || field === 'password') {
    errors.password = form.password ? '' : 'Escribe tu contraseña.'
  }
  return !errors.email && !errors.password
}

function onBlur(field: 'email' | 'password'): void {
  if (form[field]) validate(field)
}

async function submit(): Promise<void> {
  if (busy.value || locked.value) return
  formError.value = ''
  if (!validate()) {
    status.value = 'incomplete'
    await nextTick()
    if (errors.email) emailField.value?.focus()
    else passwordField.value?.focus()
    return
  }

  status.value = 'submitting'
  try {
    const user = await auth.login(form.email.trim(), form.password)
    grantedName.value = user.name
    status.value = 'success'
    setTimeout(() => router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/chat'), SUCCESS_PAUSE_MS)
  }
  catch (error) {
    onFailed(error)
  }
}

function onFailed(error: unknown): void {
  const apiError = error instanceof ApiError ? error : new ApiError(500, 'No se pudo iniciar sesión.')
  formError.value = apiError.message

  if (apiError.status === 429) {
    lockedUntil.value = Date.now() + (apiError.retryAfter ?? 30) * 1000
    formError.value = 'Demasiados intentos fallidos. Espera a que termine la pausa.'
    status.value = 'locked'
  }
  else if (apiError.isOffline || apiError.status >= 500) {
    status.value = 'offline'
  }
  else {
    status.value = 'rejected'
    form.password = ''
    // "Credenciales incorrectas." comes as the email error too; it is shown once, above the button.
    const emailError = apiError.firstFieldError('email')
    errors.email = emailError && emailError !== apiError.message ? emailError : ''
    errors.password = apiError.firstFieldError('password') ?? ''
    shake()
    nextTick(() => passwordField.value?.focus())
  }
}

function shake(): void {
  if (!formEl.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  formEl.value.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
    { duration: 420, easing: 'ease-out' },
  )
}
</script>

<template>
  <AuthLayout>
    <div class="login">
      <section class="tenant rise-in" style="--i: 0" aria-label="Tenant">
        <span class="tenant__label">Espacio de trabajo</span>
        <div class="tenant__card">
          <span class="tenant__glyph" aria-hidden="true">
            {{ tenant.id?.charAt(0).toUpperCase() }}
          </span>
          <div class="tenant__body">
            <span class="tenant__name">{{ tenant.id }}</span>
            <span class="tenant__host">
              <UiIcon name="globe" :size="12" />
              {{ tenant.hostname }}
            </span>
          </div>
          <span class="tenant__state">
            <span class="tenant__dot" aria-hidden="true" />
            conectado
          </span>
        </div>
      </section>

      <header class="login__header">
        <h1 class="login__title rise-in" style="--i: 1">
          Inicia sesión
        </h1>
        <p class="login__lede rise-in" style="--i: 2">
          Entra con tu cuenta de <strong>{{ tenant.id }}</strong>. Cada tenant tiene sus propios usuarios.
        </p>
      </header>

      <form ref="formEl" class="login__form" novalidate @submit.prevent="submit">
        <UiTextField
          ref="emailField"
          v-model="form.email"
          class="rise-in"
          style="--i: 3"
          label="Correo"
          type="email"
          inputmode="email"
          autocomplete="username"
          placeholder="nombre@pull.srl"
          :error="errors.email"
          :disabled="busy"
          @blur="onBlur('email')"
        />

        <UiTextField
          ref="passwordField"
          v-model="form.password"
          class="rise-in"
          style="--i: 4"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          :error="errors.password"
          :disabled="busy"
          @blur="onBlur('password')"
        />

        <div class="login__alert" :class="{ 'is-open': !!formError }">
          <p class="login__alert-text" role="alert">
            <UiIcon name="alert" :size="16" />
            <span>{{ formError }}</span>
          </p>
        </div>

        <UiButton class="login__submit rise-in" style="--i: 5" type="submit" block :loading="busy" :disabled="busy || locked">
          <Transition name="label" mode="out-in">
            <span v-if="status === 'submitting'" key="loading" class="login__submit-label">
              <UiSpinner /> Verificando
            </span>
            <span v-else-if="status === 'success'" key="done" class="login__submit-label">
              <UiIcon name="check" /> Acceso concedido
            </span>
            <span v-else-if="locked" key="locked" class="login__submit-label tabular">
              <UiIcon name="clock" /> Espera {{ secondsLeft }} s
            </span>
            <span v-else key="idle" class="login__submit-label">
              Entrar <UiIcon name="arrow-right" class="login__arrow" />
            </span>
          </Transition>
        </UiButton>

        <UiStatusLine class="login__status rise-in" style="--i: 6" :message="statusLine.message" :tone="statusLine.tone" />
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped>
.login {
  width: 100%;
  max-width: 24rem;
}

.tenant {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-10);
}

.tenant__label {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.tenant__card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.tenant__glyph {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-sm);
  background: var(--color-ink);
  color: var(--color-on-ink);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}

.tenant__body {
  display: grid;
  min-width: 0;
  line-height: 1.3;
}

.tenant__name {
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant__host {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.tenant__state {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tenant__dot {
  position: relative;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-ink);
}

.tenant__dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: inherit;
  animation: ping 2.4s var(--ease-out) infinite;
}

.login__header {
  margin-bottom: var(--space-8);
}

.login__title {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}

.login__lede {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.login__lede strong {
  font-weight: 500;
  color: var(--color-text);
}

.login__form {
  display: grid;
  gap: var(--space-5);
}

.login__alert {
  display: grid;
  grid-template-rows: 0fr;
  margin-block: calc(var(--space-5) / -2);
  opacity: 0;
  transform: scale(0.98);
  transition:
    grid-template-rows var(--duration-base) var(--ease-out),
    margin var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.login__alert.is-open {
  grid-template-rows: 1fr;
  margin-block: 0;
  opacity: 1;
  transform: none;
}

.login__alert-text {
  display: flex;
  gap: var(--space-2);
  min-height: 0;
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.login__alert-text :deep(svg) {
  margin-top: 2px;
}

.login__submit {
  margin-top: var(--space-1);
}

.login__submit-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.login__arrow {
  transition: transform var(--duration-base) var(--ease-out);
}

@media (hover: hover) {
  .login__submit:hover:not(:disabled) .login__arrow {
    transform: translateX(3px);
  }
}

.login__status {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.label-enter-active,
.label-leave-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out),
    filter 200ms var(--ease-out);
}

.label-enter-from {
  opacity: 0;
  transform: translateY(8px);
  filter: blur(3px);
}

.label-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  filter: blur(3px);
}

@keyframes ping {
  from {
    opacity: 0.5;
    transform: scale(1);
  }
  60%,
  to {
    opacity: 0;
    transform: scale(3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tenant__dot::after {
    animation: none;
  }
}
</style>
