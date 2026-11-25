import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Keeps the page pinned to the end while new entries arrive, unless the user
 * scrolled up to read.
 */
export function useStickToBottom(watchSource: () => unknown) {
  const THRESHOLD_PX = 120
  const pinned = ref(true)

  function distanceToBottom(): number {
    const root = document.scrollingElement ?? document.documentElement
    return root.scrollHeight - root.scrollTop - root.clientHeight
  }

  function onScroll(): void {
    pinned.value = distanceToBottom() < THRESHOLD_PX
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
    const root = document.scrollingElement ?? document.documentElement
    window.scrollTo({ top: root.scrollHeight, behavior })
  }

  watch(watchSource, async () => {
    if (!pinned.value) return
    await nextTick()
    scrollToBottom('smooth')
  }, { flush: 'post' })

  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

  return { pinned, scrollToBottom }
}
