<script setup lang="ts">
import { useTenantStore } from '@/stores/tenant'

/** The tenant of this domain, in the system's voice. */
const tenant = useTenantStore()
</script>

<template>
  <span class="tenant-chip" :title="`Tenant de ${tenant.hostname}`">
    <span class="tenant-chip__dot" aria-hidden="true" />
    <span class="sr-only">Tenant</span>
    {{ tenant.id }}
  </span>
</template>

<style scoped>
.tenant-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 1.75rem;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.tenant-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-ink);
}
</style>
