import { offersFrom, type SupplierOffer } from './supplier'
import type { ClothingCost, RestockRequest } from './types'

/** A request newer than this counts as already sent, so the button doesn't invite a duplicate email. */
const RECENT_MS = 24 * 60 * 60 * 1000
/** Requests older than this no longer show as a delivery to expect. */
const DELIVERY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

/** The newest restock request per clothing ID. `list` must be newest first. */
export function latestRestock(list: RestockRequest[] | undefined): Map<string, RestockRequest> {
  const latest = new Map<string, RestockRequest>()
  for (const r of list ?? []) if (!latest.has(r.clothingId)) latest.set(r.clothingId, r)
  return latest
}

export function isRecentRestock(r: RestockRequest | undefined, now = Date.now()): r is RestockRequest {
  return !!r && now - new Date(r.createdAt).getTime() < RECENT_MS
}

/** Stock asked for from the suppliers and not yet marked received. */
export interface Delivery {
  clothingId: string
  askedAt: string
  /** From the request's suggested order, else the last purchase of this item. */
  quantity?: number
  /** Every open request for the item, all closed together. */
  requestIds: string[]
  /** Suppliers' offers for these requests, newest first. */
  offers: SupplierOffer[]
}

/** The quantity the dashboard writes into the note: "Suggested order: 12 units." */
export function suggestedQuantity(note: string): number | undefined {
  const m = /Suggested order: (\d+)/i.exec(note)
  return m ? Number(m[1]) : undefined
}

/** One delivery per item with open requests from the last 30 days. `list` must be newest first. */
export function openDeliveries(list: RestockRequest[], costs: ClothingCost[], now = Date.now()): Delivery[] {
  const lastBought = new Map<string, number>()
  const purchases = costs
    .filter((c) => c.costType === 'Purchase' && c.quantity > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const p of purchases) if (!lastBought.has(p.clothingId)) lastBought.set(p.clothingId, p.quantity)

  const byItem = new Map<string, Delivery>()
  for (const r of list) {
    if (r.closed || now - new Date(r.createdAt).getTime() > DELIVERY_WINDOW_MS) continue
    const d = byItem.get(r.clothingId)
    if (d) {
      d.requestIds.push(r.id)
      d.quantity ??= suggestedQuantity(r.note)
    } else {
      byItem.set(r.clothingId, {
        clothingId: r.clothingId,
        askedAt: r.createdAt,
        quantity: suggestedQuantity(r.note),
        requestIds: [r.id],
        offers: [],
      })
    }
  }
  const offers = offersFrom(costs).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  for (const d of byItem.values()) {
    d.quantity ??= lastBought.get(d.clothingId)
    d.offers = offers.filter((o) => d.requestIds.includes(o.requestId))
  }
  return [...byItem.values()]
}
