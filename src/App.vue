<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccessStore } from '@/stores/access'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useTenantStore } from '@/stores/tenant'
import TenantGateView from '@/views/TenantGateView.vue'

const tenant = useTenantStore()
const auth = useAuthStore()
const chat = useChatStore()
const access = useAccessStore()
const router = useRouter()
const route = useRoute()

// Logout, an expired token or any 401 ends the session: clear its data and go to the login.
watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) return
  chat.reset()
  access.reset()
  if (!route.meta.public) router.replace('/login')
})

// The gate can turn ready later (Reintentar): restore the session then.
watch(() => tenant.state, async (state, previous) => {
  if (state !== 'ready' || previous === 'ready') return
  await auth.restore()
  if (!route.meta.public && !auth.isLoggedIn) router.replace('/login')
})
</script>

<template>
  <TenantGateView v-if="tenant.state !== 'ready'" />
  <RouterView v-else v-slot="{ Component, route: current }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="current.meta.public ? 'public' : current.path" />
    </Transition>
  </RouterView>
</template>

<style>
.page-enter-active {
  transition:
    opacity 420ms var(--ease-out),
    transform 420ms var(--ease-out),
    filter 420ms var(--ease-out);
}

.page-leave-active {
  transition:
    opacity 200ms var(--ease-in-out),
    transform 200ms var(--ease-in-out),
    filter 200ms var(--ease-in-out);
}

.page-enter-from {
  opacity: 0;
  transform: scale(1.01);
  filter: blur(4px);
}

.page-leave-to {
  opacity: 0;
  transform: scale(0.985);
  filter: blur(4px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity var(--duration-base) linear;
  }

  .page-enter-from,
  .page-leave-to {
    transform: none;
    filter: none;
  }
}
</style>
