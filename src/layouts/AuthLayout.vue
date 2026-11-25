<script setup lang="ts">
import AppWordmark from '@/components/AppWordmark.vue'
import UiThemeToggle from '@/components/ui/UiThemeToggle.vue'
import { useTenantStore } from '@/stores/tenant'

const tenant = useTenantStore()
</script>

<template>
  <div class="auth-layout">
    <header class="auth-layout__bar">
      <AppWordmark />
      <UiThemeToggle />
    </header>

    <main class="auth-layout__main">
      <slot />
    </main>

    <footer class="auth-layout__bar auth-layout__footer">
      <span>Acceso restringido a cuentas autorizadas</span>
      <span class="auth-layout__host">{{ tenant.hostname }}</span>
    </footer>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  padding:
    max(var(--space-5), env(safe-area-inset-top))
    max(var(--space-5), env(safe-area-inset-right))
    max(var(--space-5), env(safe-area-inset-bottom))
    max(var(--space-5), env(safe-area-inset-left));
}

.auth-layout__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.auth-layout__main {
  display: grid;
  place-items: center;
  padding-block: var(--space-12);
}

.auth-layout__footer {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.auth-layout__host {
  font-family: var(--font-mono);
}

@media (min-width: 768px) {
  .auth-layout {
    padding: var(--space-8) var(--space-10);
  }

  .auth-layout__main {
    padding-bottom: var(--space-16);
  }
}
</style>
