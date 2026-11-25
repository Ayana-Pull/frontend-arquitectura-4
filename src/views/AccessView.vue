<script setup lang="ts">
import { computed, onMounted } from 'vue'
import RepositoryRow from '@/components/access/RepositoryRow.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAccessStore } from '@/stores/access'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

const access = useAccessStore()
const auth = useAuthStore()
const tenant = useTenantStore()

const expiresAt = computed(() => {
  const value = auth.session?.expiresAt
  return value
    ? new Intl.DateTimeFormat('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : 'sin caducidad'
})

onMounted(() => access.load())
</script>

<template>
  <AppLayout>
    <div class="access">
      <header class="access__header">
        <h1 class="access__title rise-in" style="--i: 0">
          Tus accesos
        </h1>
        <p class="access__lede rise-in" style="--i: 1">
          Lo que Pi puede hacer en tu nombre en <strong>{{ tenant.id }}</strong>. Laravel lo vuelve a comprobar en cada acción, así que un cambio aquí vale desde la siguiente.
        </p>
      </header>

      <section class="access__section rise-in" style="--i: 2" aria-labelledby="session-title">
        <h2 id="session-title" class="access__section-title">
          Sesión
        </h2>
        <dl class="access__facts">
          <div>
            <dt>Nombre</dt>
            <dd>{{ auth.user?.name }}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd class="is-mono">
              {{ auth.user?.email }}
            </dd>
          </div>
          <div>
            <dt>Tenant</dt>
            <dd class="is-mono">
              {{ tenant.id }} · {{ tenant.hostname }}
            </dd>
          </div>
          <div>
            <dt>Caduca</dt>
            <dd class="is-mono">
              {{ expiresAt }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="access__section rise-in" style="--i: 3" aria-labelledby="repos-title">
        <div class="access__section-head">
          <h2 id="repos-title" class="access__section-title">
            Repositorios
          </h2>
          <UiButton variant="ghost" size="sm" :disabled="access.state === 'loading'" @click="access.load()">
            <UiSpinner v-if="access.state === 'loading'" :size="14" />
            <UiIcon v-else name="refresh" :size="14" />
            Actualizar
          </UiButton>
        </div>

        <p v-if="access.state === 'error'" class="access__error" role="alert">
          <UiIcon name="alert" :size="16" />
          {{ access.error }}
        </p>

        <div v-else-if="access.state === 'ready' && !access.repositories.length" class="access__empty">
          <UiIcon name="lock" :size="20" />
          <p>
            Aún no tienes acceso a ningún repositorio. Todo usuario nuevo empieza con el rol <code>visitor</code>, que no da acceso: pide a un administrador de {{ tenant.id }} que te asigne uno.
          </p>
        </div>

        <ul v-else class="access__repos" :aria-busy="access.state === 'loading'">
          <RepositoryRow v-for="repository in access.repositories" :key="repository.slug" :repository="repository" />
        </ul>

        <p class="access__legend">
          <span><strong>lector</strong> lee</span>
          <span><strong>editor</strong> lee, escribe y ejecuta</span>
          <span>gana el nivel más alto de tus reglas; una regla <code>none</code> tuya bloquea el repositorio aunque un rol lo dé</span>
        </p>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.access {
  display: grid;
  gap: var(--space-12);
  max-width: 46rem;
  margin-inline: auto;
}

.access__title {
  font-size: clamp(var(--text-2xl), 1.3rem + 1.8vw, 2.5rem);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-display);
}

.access__lede {
  max-width: 34rem;
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.access__lede strong {
  font-weight: 500;
  color: var(--color-text);
}

.access__section {
  display: grid;
  gap: var(--space-4);
}

.access__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.access__section-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
}

.access__facts {
  border-top: 1px solid var(--color-border);
}

.access__facts > div {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.access__facts dt {
  color: var(--color-text-muted);
}

.access__facts dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.access__facts .is-mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.9;
}

.access__repos {
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-border);
  transition: opacity var(--duration-base) var(--ease-out);
}

.access__repos[aria-busy='true'] {
  opacity: 0.5;
}

.access__empty {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.access__empty :deep(svg) {
  margin-top: 1px;
}

.access__error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-danger);
}

.access__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.access__legend strong {
  font-weight: 500;
  color: var(--color-text-muted);
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-text);
}

@media (max-width: 479px) {
  .access__facts > div {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
</style>
