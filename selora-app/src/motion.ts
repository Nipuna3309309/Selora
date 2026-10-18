import { flushSync } from 'react-dom'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Runs an update inside a view transition when the browser supports it. `page` lifts the
 * old page away and slides the sidebar marker; `fade` crossfades (light/dark switch).
 * Without support it just updates.
 */
export function transition(update: () => void, kind: 'page' | 'fade' = 'page') {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }
  const root = document.documentElement
  root.dataset.vt = kind
  const vt = document.startViewTransition(() => flushSync(update))
  void vt.finished.finally(() => delete root.dataset.vt)
}
