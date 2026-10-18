import { useSyncExternalStore } from 'react'

export interface CartLine {
  clothingId: string
  quantity: number
}

export const MAX_QTY = 10

/** The cart lives in this browser only, one per signed-in user. Prices and stock are never stored in it. */
let storeKey = ''
let lines: CartLine[] = []
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(lines))
  } catch {
    /* storage can be blocked; the cart then lasts for this visit only */
  }
}

function set(next: CartLine[]) {
  lines = next
  persist()
  listeners.forEach((l) => l())
}

/** Loads the saved cart for this user. Call once when the signed-in user is known. */
export function initCart(email: string) {
  storeKey = `selora-cart:${email.toLowerCase()}`
  let saved: CartLine[] = []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storeKey) ?? '[]')
    if (Array.isArray(parsed)) {
      saved = parsed.filter(
        (l): l is CartLine =>
          !!l && typeof l.clothingId === 'string' && Number.isInteger(l.quantity) && l.quantity >= 1,
      )
    }
  } catch {
    /* unreadable cart: start empty */
  }
  lines = saved.map((l) => ({ ...l, quantity: Math.min(l.quantity, MAX_QTY) }))
  listeners.forEach((l) => l())
}

export function addToCart(clothingId: string, quantity: number) {
  const existing = lines.find((l) => l.clothingId === clothingId)
  if (existing) {
    set(lines.map((l) => (l === existing ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l)))
  } else {
    set([...lines, { clothingId, quantity: Math.min(MAX_QTY, quantity) }])
  }
}

export function setCartQuantity(clothingId: string, quantity: number) {
  set(lines.map((l) => (l.clothingId === clothingId ? { ...l, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : l)))
}

export function removeFromCart(clothingId: string) {
  set(lines.filter((l) => l.clothingId !== clothingId))
}

export function clearCart() {
  set([])
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => lines,
  )
}
