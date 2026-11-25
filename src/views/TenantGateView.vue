<script setup lang="ts">
import { computed } from 'vue'
import { apiLocation } from '@/api/config'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiStatusLine from '@/components/ui/UiStatusLine.vue'
import type { StatusTone } from '@/components/ui/UiStatusLine.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useTenantStore } from '@/stores/tenant'

/**
 * Shown instead of the app until GET /api/tenant names the tenant of this
 * domain: while asking, on a central domain, on an unknown one, or offline.
 */
const tenant = useTenantStore()

const port = window.location.port ? `:${window.location.port}` : ''
const exampleUrl = `${window.location.protocol}//demo.localhost${port}`

const status = computed<{ message: string, tone: StatusTone }>(() => {
  switch (tenant.state) {
    case 'central': return { message: `dominio central · ${tenant.hostname}`, tone: 'idle' }
    case 'not-found': return { message: `tenant no encontrado · ${tenant.hostname}`, tone: 'error' }
    case 'offline': return { message: 'servidor no disponible', tone: 'error' }
    default: return { message: `buscando el tenant de ${tenant.hostname}`, tone: 'busy' }
  }
})
</script>

<template>
  <AuthLayout>
    <div class="gate">
      <template v-if="tenant.state === 'central'">
        <h1 class="gate__title rise-in" style="--i: 0">
          Entra por tu espacio de trabajo
        </h1>
        <p class="gate__lede rise-in" style="--i: 1">
          <code>{{ tenant.hostname }}</code> es el dominio central de orquestador y no pertenece a ningún tenant. Cada organización tiene su propia dirección, con sus usuarios y sus datos.
        </p>
        <a class="gate__link rise-in" style="--i: 2" :href="exampleUrl">
          <UiIcon name="globe" :size="16" />
          {{ exampleUrl.replace(/^https?:\/\//, '') }}
          <UiIcon name="arrow-right" :size="16" class="gate__arrow" />
        </a>
      </template>

      <template v-else-if="tenant.state === 'not-found'">
        <h1 class="gate__title rise-in" style="--i: 0">
          Este dominio no tiene tenant
        </h1>
        <p class="gate__lede rise-in" style="--i: 1">
          <code>{{ tenant.hostname }}</code> no está registrado en orquestador. Revisa la dirección que te dio tu organización.
        </p>
      </template>

      <template v-else-if="tenant.state === 'offline'">
        <h1 class="gate__title rise-in" style="--i: 0">
          No se pudo conectar
        </h1>
        <p class="gate__lede rise-in" style="--i: 1">
          El API en <code>{{ apiLocation.baseUrl }}</code> no responde. Comprueba que Laravel esté arrancado.
        </p>
        <UiButton class="rise-in" style="--i: 2" variant="outline" @click="tenant.load()">
          <UiIcon name="refresh" :size="16" />
          Reintentar
        </UiButton>
      </template>

      <UiStatusLine class="gate__status rise-in" style="--i: 3" :message="status.message" :tone="status.tone" />
    </div>
  </AuthLayout>
</template>

<style scoped>
.gate {
  display: grid;
  justify-items: start;
  gap: var(--space-5);
  width: 100%;
  max-width: 28rem;
}

.gate__title {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}

.gate__lede {
  margin-top: calc(var(--space-2) * -1);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.gate__lede code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-text);
  overflow-wrap: anywhere;
}

.gate__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding-inline: var(--space-4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-decoration: none;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.gate__arrow {
  transition: transform var(--duration-base) var(--ease-out);
}

@media (hover: hover) {
  .gate__link:hover {
    background: var(--color-surface);
  }

  .gate__link:hover .gate__arrow {
    transform: translateX(3px);
  }
}

.gate__status {
  width: 100%;
  margin-top: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
</style>
