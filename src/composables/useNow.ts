import { onBeforeUnmount, ref } from 'vue'

/** A clock that ticks every second while the component lives, for elapsed times and countdowns. */
export function useNow(intervalMs = 1000) {
  const now = ref(Date.now())
  const timer = setInterval(() => (now.value = Date.now()), intervalMs)
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
