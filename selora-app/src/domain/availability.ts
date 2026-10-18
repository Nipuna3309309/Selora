import type { Clothing } from './types'

export type Availability = { kind: 'ok' | 'low' | 'out' | 'off'; text: string }

export function availability(c: Clothing): Availability {
  if (!c.isActive) return { kind: 'off', text: 'Not available' }
  if (c.stock <= 0) return { kind: 'out', text: 'Sold out' }
  if (c.stock <= c.lowStockThreshold) return { kind: 'low', text: `Only ${c.stock} left` }
  return { kind: 'ok', text: `${c.stock} in stock` }
}
