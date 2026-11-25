/**
 * Onda de texto que acompaña al revelado circular del cambio de tema: cada texto e icono
 * se asienta justo cuando el borde del círculo lo alcanza.
 * Debe coincidir con `theme-reveal` en assets/styles/motion.css (620ms, ease-in-out).
 */
const REVEAL_MS = 620
const REVEAL_EASE = [0.65, 0, 0.35, 1] as const
const SETTLE_MS = 560
const MAX_TARGETS = 240

const SETTLE_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(7px)', filter: 'blur(5px)', opacity: 0.15 },
  { transform: 'none', filter: 'blur(0px)', opacity: 1 },
]

/** Tiempo (ms) en que el radio del revelado llega a `progress` (0–1) de su tamaño final. */
function revealTimeAt(progress: number) {
  const [x1, y1, x2, y2] = REVEAL_EASE
  const bezier = (s: number, p1: number, p2: number) =>
    3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s ** 2 * p2 + s ** 3

  for (let s = 0; s <= 1; s += 1 / 64) {
    if (bezier(s, y1, y2) >= progress) return bezier(s, x1, x2) * REVEAL_MS
  }
  return REVEAL_MS
}

/** Elementos con texto propio (o iconos) visibles en pantalla. */
function collectTargets() {
  const targets: HTMLElement[] = []
  const all = document.body.querySelectorAll<HTMLElement>('body *:not(script, style, .sr-only, .intro, .intro *)')

  for (const el of all) {
    if (targets.length >= MAX_TARGETS) break
    const ownText = [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    const isIcon = el.matches('.ui-icon, .wordmark__caret, .status__caret')
    if (!ownText && !isIcon) continue
    // Un contenedor ya animado arrastra a sus hijos; animarlos también duplicaría el desplazamiento.
    if (targets.some(target => target.contains(el))) continue

    const rect = el.getBoundingClientRect()
    if (!rect.width || rect.bottom < 0 || rect.top > window.innerHeight) continue
    targets.push(el)
  }
  return targets
}

export function playThemeWave(origin: { x: number, y: number }, radius: number) {
  for (const el of collectTargets()) {
    const rect = el.getBoundingClientRect()
    const distance = Math.hypot(rect.left + rect.width / 2 - origin.x, rect.top + rect.height / 2 - origin.y)

    el.animate(SETTLE_KEYFRAMES, {
      duration: SETTLE_MS,
      delay: revealTimeAt(Math.min(distance / radius, 1)),
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'backwards',
    })
  }
}
