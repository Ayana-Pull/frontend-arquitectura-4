<script setup lang="ts">
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue'
import ChatComposer from '@/components/chat/ChatComposer.vue'
import ChatEntry from '@/components/chat/ChatEntry.vue'
import ChatStatusBar from '@/components/chat/ChatStatusBar.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiIcon from '@/components/ui/UiIcon.vue'
import { useNow } from '@/composables/useNow'
import { useStickToBottom } from '@/composables/useStickToBottom'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAccessStore } from '@/stores/access'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useTenantStore } from '@/stores/tenant'
import { highestLevel, LEVEL_LABELS } from '@/utils/access'

const chat = useChatStore()
const auth = useAuthStore()
const tenant = useTenantStore()
const access = useAccessStore()
const now = useNow()

const composer = useTemplateRef<{ focus: () => void }>('composer')

const SUGGESTIONS = [
  '¿Qué repositorios puedo tocar y con qué permisos?',
  'Propón un plan por etapas para añadir tests al repositorio api',
  'Explica qué haría falta para cambiar el login en web',
]

const repositories = computed(() => access.repositories.map(repository => ({
  slug: repository.slug,
  level: LEVEL_LABELS[highestLevel(repository.access)],
})))

const { scrollToBottom } = useStickToBottom(() => [chat.items.length, chat.items.at(-1)?.kind === 'assistant' ? chat.items.at(-1) : null])

async function send(text: string): Promise<void> {
  const pending = chat.send(text)
  await nextTick()
  scrollToBottom()
  await pending
  composer.value?.focus()
}

function suggest(text: string): void {
  chat.draft = text
  composer.value?.focus()
}

function startNew(): void {
  chat.startNew()
  nextTick(() => composer.value?.focus())
}

// The answer is whole when it lands: follow it once it renders.
watch(() => chat.active, (next, previous) => {
  if (previous && !next) nextTick(() => scrollToBottom())
})

onMounted(() => {
  if (auth.user) chat.open(auth.user.id)
  if (access.state === 'idle') access.load()
  composer.value?.focus()
  scrollToBottom('instant')
})
</script>

<template>
  <AppLayout>
    <div class="chat" :class="{ 'is-empty': chat.isEmpty }">
      <Transition name="intro">
        <div v-if="chat.isEmpty" class="chat__intro">
          <h1 class="chat__title rise-in" style="--i: 0">
            ¿Qué hacemos hoy, {{ auth.firstName }}?
          </h1>
          <p class="chat__lede rise-in" style="--i: 1">
            Pi planifica el trabajo sobre los repositorios de <strong>{{ tenant.id }}</strong> y Laravel autoriza cada acción en tu nombre.
          </p>

          <RouterLink v-if="repositories.length" to="/accesos" class="chat__repos rise-in" style="--i: 2">
            <UiIcon name="repo" :size="14" />
            <span v-for="repository in repositories" :key="repository.slug" class="chat__repo">
              {{ repository.slug }} <span class="chat__repo-level">{{ repository.level }}</span>
            </span>
          </RouterLink>
          <RouterLink v-else-if="access.state === 'ready'" to="/accesos" class="chat__repos rise-in" style="--i: 2">
            <UiIcon name="lock" :size="14" />
            aún no tienes repositorios asignados
          </RouterLink>

          <ul class="chat__suggestions" aria-label="Sugerencias">
            <li v-for="(text, index) in SUGGESTIONS" :key="text" class="rise-in" :style="{ '--i': index + 3 }">
              <button type="button" class="chat__suggestion" @click="suggest(text)">
                {{ text }}
                <UiIcon name="arrow-right" :size="14" class="chat__suggestion-arrow" />
              </button>
            </li>
          </ul>
        </div>
      </Transition>

      <div v-if="!chat.isEmpty" class="chat__toolbar">
        <span class="chat__session">{{ chat.conversation?.title ?? 'Conversación nueva' }}</span>
        <UiButton variant="ghost" size="sm" aria-label="Nueva conversación" :disabled="chat.busy" @click="startNew">
          <UiIcon name="plus" :size="16" />
          <span class="chat__new-label">Nueva conversación</span>
        </UiButton>
      </div>

      <ol v-if="!chat.isEmpty" class="chat__thread" aria-live="polite">
        <ChatEntry v-for="item in chat.items" :key="item.id" :item="item" :now="now" />
      </ol>

      <div class="chat__dock">
        <ChatComposer
          ref="composer"
          v-model="chat.draft"
          :busy="chat.busy"
          :cancelling="chat.active?.status === 'cancelling'"
          @send="send"
          @stop="chat.cancel()"
        />
        <ChatStatusBar :now="now" />
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 46rem;
  min-height: calc(100dvh - 4rem);
  margin-inline: auto;
  padding: var(--space-8) var(--space-5) 0;
}

.chat.is-empty {
  justify-content: center;
  padding-bottom: 12vh;
}

.chat__intro {
  margin-bottom: var(--space-8);
}

.chat__title {
  font-size: clamp(var(--text-2xl), 1.3rem + 1.8vw, 3rem);
  font-weight: 600;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}

.chat__lede {
  max-width: 34rem;
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  text-wrap: pretty;
}

.chat__lede strong {
  font-weight: 500;
  color: var(--color-text);
}

.chat__repos {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  .chat__repos:hover {
    border-color: var(--color-border-strong);
    color: var(--color-text);
  }
}

.chat__repo {
  color: var(--color-text);
}

.chat__repo-level {
  color: var(--color-text-subtle);
}

.chat__suggestions {
  display: grid;
  gap: var(--space-1);
  margin-top: var(--space-8);
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}

.chat__suggestions li {
  border-bottom: 1px solid var(--color-border);
}

.chat__suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-align: left;
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.chat__suggestion-arrow {
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

@media (hover: hover) {
  .chat__suggestion:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }

  .chat__suggestion:hover .chat__suggestion-arrow {
    opacity: 1;
    transform: none;
  }
}

.chat__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.chat__session {
  min-width: 0;
  overflow: hidden;
  font-size: var(--text-sm);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 479px) {
  .chat__new-label {
    display: none;
  }
}

.chat__thread {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-8);
  margin: 0;
  padding: 0 0 var(--space-10);
}

.chat__dock {
  position: relative;
  z-index: 5;
}

.chat:not(.is-empty) .chat__dock {
  position: sticky;
  bottom: 0;
  padding-bottom: max(var(--space-4), env(safe-area-inset-bottom));
  background: var(--color-bg);
}

/* Fades the text that scrolls behind the composer. */
.chat:not(.is-empty) .chat__dock::before {
  content: '';
  position: absolute;
  inset: calc(var(--space-8) * -1) 0 100%;
  background: linear-gradient(to bottom, transparent, var(--color-bg));
  pointer-events: none;
}

.intro-leave-active {
  transition:
    opacity 220ms var(--ease-out),
    transform 220ms var(--ease-out),
    filter 220ms var(--ease-out);
}

.intro-leave-to {
  opacity: 0;
  transform: translateY(-16px);
  filter: blur(6px);
}
</style>
