<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import AppWordmark from '@/components/AppWordmark.vue'
import TenantChip from '@/components/TenantChip.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import UiThemeToggle from '@/components/ui/UiThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const leaving = ref(false)

async function logout(): Promise<void> {
  leaving.value = true
  try {
    await auth.logout()
  }
  finally {
    leaving.value = false
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-layout__bar">
      <div class="app-layout__start">
        <AppWordmark />
        <AppNav />
      </div>

      <div class="app-layout__actions">
        <TenantChip class="app-layout__tenant" />
        <div v-if="auth.user" class="app-layout__user">
          <span class="app-layout__name">{{ auth.user.name }}</span>
          <span class="app-layout__email">{{ auth.user.email }}</span>
        </div>
        <UiThemeToggle />
        <UiButton variant="ghost" class="app-layout__logout" aria-label="Salir" :loading="leaving" :disabled="leaving" @click="logout">
          <UiIcon name="log-out" :size="16" />
          <span class="app-layout__logout-label">Salir</span>
        </UiButton>
      </div>
    </header>

    <main class="app-layout__main" :class="{ 'is-full-bleed': route.meta.fullBleed }">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100dvh;
}

.app-layout__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: 4rem;
  padding-inline: var(--space-5);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.app-layout__start {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.app-layout__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-layout__tenant,
.app-layout__user {
  display: none;
}

.app-layout__user {
  flex-direction: column;
  align-items: flex-end;
  margin-right: var(--space-2);
  line-height: 1.25;
}

.app-layout__name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.app-layout__email {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.app-layout__main {
  max-width: 64rem;
  margin-inline: auto;
  padding: var(--space-12) var(--space-5);
}

.app-layout__main.is-full-bleed {
  max-width: none;
  padding: 0;
}

@media (max-width: 479px) {
  .app-layout__bar {
    gap: var(--space-2);
    padding-inline: var(--space-3);
  }

  .app-layout__start {
    gap: var(--space-2);
  }

  .app-layout__logout {
    padding-inline: var(--space-3);
  }

  .app-layout__logout-label {
    display: none;
  }
}

@media (min-width: 640px) {
  .app-layout__tenant {
    display: inline-flex;
  }

  .app-layout__bar {
    padding-inline: var(--space-10);
  }

  .app-layout__main:not(.is-full-bleed) {
    padding: var(--space-16) var(--space-10);
  }
}

@media (min-width: 900px) {
  .app-layout__user {
    display: flex;
  }
}
</style>
