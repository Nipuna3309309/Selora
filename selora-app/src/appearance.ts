import { useSyncExternalStore } from 'react'
import { transition } from './motion'

/** Light is the default; Auto follows the device. Sets html[data-mode] for index.css. */
export type Appearance = 'light' | 'dark' | 'auto'

const KEY = 'selora.appearance'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function load(): Appearance {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'dark' || saved === 'auto' ? saved : 'light'
  } catch {
    return 'light'
  }
}

let current = load()

function apply() {
  const dark = current === 'dark' || (current === 'auto' && darkQuery.matches)
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

/** Call once before the first render so the page never flashes the wrong mode. */
export function initAppearance() {
  apply()
  darkQuery.addEventListener('change', () => {
    if (current === 'auto') apply()
  })
}

export function setAppearance(next: Appearance) {
  current = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // Storage can be blocked in the host frame; the choice then lasts for this visit only.
  }
  transition(() => {
    apply()
    listeners.forEach((l) => l())
  }, 'fade')
}

export function useAppearance(): Appearance {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
