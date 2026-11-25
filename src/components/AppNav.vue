<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/** App sections. Adding a route here puts it in the bar; the pill slides to the active one. */
const LINKS = [
  { to: '/chat', label: 'Chat' },
  { to: '/accesos', label: 'Accesos' },
]

const route = useRoute()
const nav = ref<HTMLElement | null>(null)
const indicator = ref<{ left: number, width: number } | null>(null)

function isActive(to: string): boolean {
  return route.path.startsWith(to)
}

async function measure(): Promise<void> {
  await nextTick()
  const link = nav.value?.querySelector<HTMLElement>('.is-active')
  indicator.value = link ? { left: link.offsetLeft, width: link.offsetWidth } : null
}

watch(() => route.path, measure)
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <nav ref="nav" class="nav" aria-label="Secciones">
    <span
      v-if="indicator"
      class="nav__indicator"
      :style="{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }"
      aria-hidden="true"
    />
    <RouterLink
      v-for="link in LINKS"
      :key="link.to"
      :to="link.to"
      class="nav__link"
      :class="{ 'is-active': isActive(link.to) }"
      :aria-current="isActive(link.to) ? 'page' : undefined"
    >
      {{ link.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  position: relative;
  display: flex;
  gap: var(--space-1);
}

.nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 2.25rem;
  padding-inline: var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out);
}

.nav__link.is-active {
  color: var(--color-text);
}

@media (hover: hover) {
  .nav__link:hover {
    color: var(--color-text);
  }
}

.nav__indicator {
  position: absolute;
  top: 0;
  left: 0;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  transition:
    transform 450ms cubic-bezier(0.34, 1.15, 0.64, 1),
    width 450ms cubic-bezier(0.34, 1.15, 0.64, 1);
}

.nav__link:focus-visible {
  border-radius: var(--radius-full);
}

@media (prefers-reduced-motion: reduce) {
  .nav__indicator {
    transition: none;
  }
}
</style>
