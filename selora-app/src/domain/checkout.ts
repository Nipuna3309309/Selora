import type { Order } from './types'

/**
 * A checkout with several items is stored as one Orders row per item. They share a checkout id in
 * RequestId: `CHK-<uuid>:1`, `CHK-<uuid>:2`. Older single-item orders have no colon and stand alone.
 */
export function checkoutIdOf(requestId: string): string {
  const i = requestId.lastIndexOf(':')
  return i > 0 ? requestId.slice(0, i) : requestId
}

/** A short code to show customers, e.g. "A1B2C3". */
export function orderCode(checkoutId: string): string {
  return checkoutId.replace(/^(CHK|REQ)-/, '').replace(/-/g, '').slice(0, 6).toUpperCase()
}

export type GroupStatus = 'Pending' | 'Processing' | 'Confirmed' | 'Partial' | 'Rejected' | 'NeedsReview'

export interface OrderGroup {
  id: string
  code: string
  lines: Order[]
  status: GroupStatus
  /** Sum of the line totals the flow has set, or null while any is still unknown. */
  total: number | null
  createdAt: string
  createdByEmail: string
}

function groupStatus(lines: Order[]): GroupStatus {
  if (lines.some((l) => l.status === 'NeedsReview')) return 'NeedsReview'
  if (lines.some((l) => l.status === 'Processing')) return 'Processing'
  if (lines.some((l) => l.status === 'Pending')) return 'Pending'
  const confirmed = lines.filter((l) => l.status === 'Confirmed').length
  if (confirmed === lines.length) return 'Confirmed'
  return confirmed === 0 ? 'Rejected' : 'Partial'
}

/** Groups rows into orders, newest first. Lines keep the order they were placed in. */
export function groupOrders(orders: Order[]): OrderGroup[] {
  const byId = new Map<string, Order[]>()
  for (const o of orders) {
    const id = checkoutIdOf(o.requestId)
    byId.set(id, [...(byId.get(id) ?? []), o])
  }
  const groups: OrderGroup[] = []
  for (const [id, rows] of byId) {
    const lines = [...rows].sort((a, b) => a.requestId.localeCompare(b.requestId, undefined, { numeric: true }))
    const confirmedOrOpen = lines.filter((l) => l.status !== 'Rejected')
    const known = confirmedOrOpen.every((l) => l.total > 0)
    groups.push({
      id,
      code: orderCode(id),
      lines,
      status: groupStatus(lines),
      total: confirmedOrOpen.length > 0 && known ? confirmedOrOpen.reduce((s, l) => s + l.total, 0) : null,
      createdAt: lines.reduce((min, l) => (l.createdAt < min ? l.createdAt : min), lines[0].createdAt),
      createdByEmail: lines[0].createdByEmail,
    })
  }
  return groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
