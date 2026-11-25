<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RepositoryAccess } from '@/api/types'
import UiIcon from '@/components/ui/UiIcon.vue'
import { ACTION_LABELS, actionScopes, highestLevel, LEVEL_LABELS } from '@/utils/access'

/** One repository: what you can do where, and the rows (yours or your roles') that give it. */
const props = defineProps<{ repository: RepositoryAccess }>()

const open = ref(false)
const level = computed(() => highestLevel(props.repository.access))
const scopes = computed(() => actionScopes(props.repository.access))
const panelId = computed(() => `repo-${props.repository.slug}`)
</script>

<template>
  <li class="repo">
    <button type="button" class="repo__head" :aria-expanded="open" :aria-controls="panelId" @click="open = !open">
      <UiIcon name="repo" :size="18" class="repo__icon" />
      <span class="repo__slug">{{ repository.slug }}</span>
      <span class="repo__level" :data-level="level">{{ LEVEL_LABELS[level] }}</span>
      <span class="repo__count">{{ repository.access.length }} {{ repository.access.length === 1 ? 'regla' : 'reglas' }}</span>
      <UiIcon name="chevron-down" :size="16" class="repo__chevron" />
    </button>

    <dl class="repo__scopes">
      <div v-for="scope in scopes" :key="scope.action" class="repo__scope">
        <dt>{{ ACTION_LABELS[scope.action] }}</dt>
        <dd>
          <span v-if="scope.paths === null" class="repo__path is-all">todo el repositorio</span>
          <span v-for="path in scope.paths ?? []" v-else :key="path" class="repo__path">
            <UiIcon name="folder" :size="12" /> {{ path }}
          </span>
        </dd>
      </div>
    </dl>

    <div :id="panelId" class="repo__rules" :class="{ 'is-open': open }">
      <div class="repo__clip">
        <ul class="repo__rule-list">
          <li v-for="(row, index) in repository.access" :key="index" class="repo__rule">
            <UiIcon :name="row.source === 'user' ? 'user' : 'users'" :size="14" />
            <span class="repo__rule-source">{{ row.source === 'user' ? 'asignado a ti' : `rol ${row.role}` }}</span>
            <span class="repo__rule-level">{{ LEVEL_LABELS[row.level] }}</span>
            <span class="repo__rule-paths">{{ row.paths?.join(', ') ?? 'todo' }}</span>
          </li>
        </ul>
      </div>
    </div>
  </li>
</template>

<style scoped>
.repo {
  list-style: none;
  border-bottom: 1px solid var(--color-border);
}

.repo__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4) var(--space-2) var(--space-2);
  border: 0;
  background: transparent;
  text-align: left;
}

.repo__head:focus-visible {
  outline-offset: -2px;
}

.repo__icon {
  color: var(--color-text-subtle);
}

.repo__slug {
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
}

.repo__level {
  padding: 0.1rem var(--space-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.repo__level[data-level='editor'] {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-on-ink);
}

.repo__count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.repo__chevron {
  color: var(--color-text-subtle);
  transition: transform var(--duration-base) var(--ease-out);
}

[aria-expanded='true'] .repo__chevron {
  transform: rotate(180deg);
}

@media (hover: hover) {
  .repo__head:hover .repo__count,
  .repo__head:hover .repo__chevron {
    color: var(--color-text);
  }
}

.repo__scopes {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-4) calc(var(--space-2) + 18px + var(--space-3));
}

.repo__scope {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.repo__scope dt {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.repo__scope dd {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
}

.repo__path {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.repo__path.is-all {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.repo__rules {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
}

.repo__rules.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}

.repo__clip {
  min-height: 0;
  overflow: hidden;
}

.repo__rule-list {
  display: grid;
  gap: var(--space-1);
  margin: 0 var(--space-2) var(--space-4) calc(var(--space-2) + 18px + var(--space-3));
  padding: var(--space-3);
  list-style: none;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.repo__rule {
  display: grid;
  grid-template-columns: auto minmax(8rem, auto) 4.5rem 1fr;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.repo__rule-source {
  color: var(--color-text);
}

.repo__rule-level,
.repo__rule-paths {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

@media (max-width: 479px) {
  .repo__count {
    display: none;
  }

  .repo__chevron {
    margin-left: auto;
  }

  .repo__scopes,
  .repo__rule-list {
    padding-left: var(--space-2);
    margin-left: var(--space-2);
  }

  .repo__rule {
    grid-template-columns: auto 1fr auto;
  }

  .repo__rule-paths {
    grid-column: 2 / -1;
  }
}
</style>
