import { nextTick, ref } from 'vue'
import { playThemeWave } from '@/utils/themeWave'

/**
 * Light and dark mode via the "dark" class on <html> (set before first paint
 * in index.html). The new theme is revealed in a circle from the toggle;
 * without View Transitions or with reduced motion it switches directly.
 */
const STORAGE_KEY = 'orquestador-theme'
const isDark = ref(document.documentElement.classList.contains('dark'))

function apply(dark: boolean): void {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  }
  catch {
    // Without storage the choice lasts for this page only.
  }
}

export function useTheme() {
  async function toggle(origin?: { x: number, y: number }): Promise<void> {
    const next = !isDark.value
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      apply(next)
      return
    }

    const root = document.documentElement
    const x = origin?.x ?? window.innerWidth
    const y = origin?.y ?? 0
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.style.setProperty('--reveal-x', `${x}px`)
    root.style.setProperty('--reveal-y', `${y}px`)
    root.style.setProperty('--reveal-r', `${radius}px`)
    root.classList.add('theme-transition')

    const transition = document.startViewTransition(async () => {
      apply(next)
      await nextTick()
      playThemeWave({ x, y }, radius)
    })

    try {
      await transition.finished
    }
    finally {
      root.classList.remove('theme-transition')
    }
  }

  return { isDark, toggle }
}
