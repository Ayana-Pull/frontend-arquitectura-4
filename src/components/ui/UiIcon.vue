<script setup lang="ts">
/**
 * Single-stroke icons (24×24, 1.5px). Adding new ones here keeps one drawing style.
 */
const ICONS = {
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2.75v1.5M12 19.75v1.5M4.4 4.4l1.06 1.06M18.54 18.54l1.06 1.06M2.75 12h1.5M19.75 12h1.5M4.4 19.6l1.06-1.06M18.54 5.46l1.06-1.06"/>',
  'moon': '<path d="M20.25 14.5A8.25 8.25 0 0 1 9.5 3.75a8.25 8.25 0 1 0 10.75 10.75Z"/>',
  'eye': '<path d="M2.5 12S6 5.25 12 5.25 21.5 12 21.5 12 18 18.75 12 18.75 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.75"/>',
  'eye-off': '<path d="M9.9 5.5A9.6 9.6 0 0 1 12 5.25C18 5.25 21.5 12 21.5 12a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.75 12 18.75a9.3 9.3 0 0 0 5.4-1.75M3.5 3.5l17 17"/><path d="M10.06 10.06a2.75 2.75 0 0 0 3.88 3.88"/>',
  'arrow-right': '<path d="M4.75 12h14.5M13.5 6.25 19.25 12l-5.75 5.75"/>',
  'alert': '<circle cx="12" cy="12" r="9.25"/><path d="M12 7.75v5M12 16.25v.01"/>',
  'check': '<path d="m5.25 12.5 4.25 4.25 9.25-9.5"/>',
  'caps': '<path d="M12 4.75 4.75 12.5H8.5v3.25h7V12.5h3.75L12 4.75Z"/><path d="M8.5 19.25h7"/>',
  'arrow-up': '<path d="M12 19.25V4.75M6.25 10.5 12 4.75l5.75 5.75"/>',
  'stop': '<rect x="6.75" y="6.75" width="10.5" height="10.5" rx="1.75" fill="currentColor" stroke="none"/>',
  'copy': '<rect x="8.75" y="8.75" width="10.5" height="10.5" rx="2"/><path d="M15.25 8.75V6.5a1.75 1.75 0 0 0-1.75-1.75H6.5A1.75 1.75 0 0 0 4.75 6.5v7a1.75 1.75 0 0 0 1.75 1.75h2.25"/>',
  'plus': '<path d="M12 5.75v12.5M5.75 12h12.5"/>',
  'log-out': '<path d="M14.25 4.75h3.5a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-3.5M10.5 8 6.25 12l4.25 4M6.5 12h9"/>',
  'chevron-down': '<path d="m6.75 9.5 5.25 5.25 5.25-5.25"/>',
  'refresh': '<path d="M19.25 12a7.25 7.25 0 1 1-2.12-5.13M19.25 4.75v4.5h-4.5"/>',
  'close': '<path d="m6.75 6.75 10.5 10.5M17.25 6.75l-10.5 10.5"/>',
  'repo': '<path d="M6.75 19.25h-1a1 1 0 0 1-1-1V5.75a1 1 0 0 1 1-1h11.5a2 2 0 0 1 2 2v12.5h-5"/><path d="M4.75 16.25h14.5M8.25 4.75v8.5M9.75 17.75v3.5l1.5-1 1.5 1v-3.5"/>',
  'folder': '<path d="M3.75 7.25a2 2 0 0 1 2-2h3.6l2 2.25h6.9a2 2 0 0 1 2 2v7.75a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2Z"/>',
  'user': '<circle cx="12" cy="8.5" r="3.75"/><path d="M5.25 19.25c.9-3.2 3.6-5 6.75-5s5.85 1.8 6.75 5"/>',
  'users': '<circle cx="9" cy="8.75" r="3.25"/><path d="M3.25 18.75c.75-2.85 3-4.5 5.75-4.5s5 1.65 5.75 4.5M15.25 5.75a3.25 3.25 0 0 1 0 6M17.5 14.6c1.55.65 2.7 2.07 3.25 4.15"/>',
  'globe': '<circle cx="12" cy="12" r="8.25"/><path d="M3.75 12h16.5M12 3.75c2.2 2.3 3.25 5 3.25 8.25S14.2 17.95 12 20.25C9.8 17.95 8.75 15.25 8.75 12S9.8 6.05 12 3.75Z"/>',
  'lock': '<rect x="5.25" y="10.75" width="13.5" height="9.5" rx="2"/><path d="M8.25 10.75v-2.5a3.75 3.75 0 0 1 7.5 0v2.5"/>',
  'clock': '<circle cx="12" cy="12" r="8.25"/><path d="M12 7.75V12l2.75 1.75"/>',
} as const

export type IconName = keyof typeof ICONS

withDefaults(defineProps<{ name: IconName, size?: number }>(), { size: 18 })
</script>

<template>
  <svg
    class="ui-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="ICONS[name]"
  />
</template>

<style scoped>
.ui-icon {
  flex-shrink: 0;
}
</style>
