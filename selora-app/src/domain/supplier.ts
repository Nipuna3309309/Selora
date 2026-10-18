import type { ClothingCost } from './types'

/**
 * Supplier offers. A supplier answers an open restock request with how many pieces they'll send
 * and the price per piece. The Supplier Offer flow stores it as a SupplierOffer row in
 * ClothingCosts: Quantity, UnitCost, OrderItemId = the request ID, Clothing = the item, and Title =
 * JSON {s: email, n: name, d: arrive-by date, t: note, c: the shop's counter-offer}. When the admin receives the stock from an
 * offer, the purchase is logged as BUY-OFFER-<offerId>, which is how an offer counts as accepted.
 */

/** An open restock request, as the supplier sees it. */
export interface SupplierRequest {
  id: string
  clothingId: string
  note: string
  createdAt: string
}

export type OfferStatus = 'Waiting' | 'Accepted' | 'Not needed'

export interface SupplierOffer {
  id: string
  requestId: string
  clothingId: string
  quantity: number
  unitCost: number
  supplierEmail: string
  supplierName: string
  /** YYYY-MM-DD, or empty. */
  arriveBy: string
  note: string
  /** The shop's counter-offer, if it is negotiating. The supplier answers by changing the offer. */
  counter?: Counter
  createdAt: string
}

/** What the shop proposes instead of the supplier's offer. */
export interface Counter {
  quantity: number
  unitCost: number
  note: string
}

export interface OfferInput {
  requestId: string
  quantity: number
  unitCost: number
  arriveBy: string
  note: string
}

export const NOTE_MAX = 100
/** Short, because the whole offer info shares one 255-character Title column. */
export const COUNTER_NOTE_MAX = 40

/** The purchase ID used when stock is received from an offer, so the offer shows as Accepted. */
export const offerPurchaseId = (offerId: string) => `OFFER-${offerId}`

function info(title: string): { s?: string; n?: string; d?: string; t?: string; c?: { q?: number; p?: number; t?: string } } {
  try {
    const v = JSON.parse(title)
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/** Builds an offer from the fields the flow returns, or from a SupplierOffer row. */
export function toOffer(r: {
  id: string
  requestId: string
  clothingId: string
  quantity: number
  unitCost: number
  title: string
  createdAt: string
}): SupplierOffer {
  const i = info(r.title)
  const counter = i.c && Number.isFinite(i.c.q) && Number.isFinite(i.c.p) ? { quantity: Number(i.c.q), unitCost: Number(i.c.p), note: String(i.c.t ?? '') } : undefined
  return {
    id: r.id,
    requestId: r.requestId,
    clothingId: r.clothingId,
    quantity: r.quantity,
    unitCost: r.unitCost,
    supplierEmail: String(i.s ?? ''),
    supplierName: String(i.n || i.s || 'Supplier'),
    arriveBy: String(i.d ?? ''),
    note: String(i.t ?? ''),
    counter,
    createdAt: r.createdAt,
  }
}

/** The offer's Title JSON with the shop's counter put in (or removed), the rest kept as it was. */
export function titleWithCounter(title: string, counter: Counter | undefined): string {
  const i = info(title)
  if (counter) i.c = { q: counter.quantity, p: counter.unitCost, t: counter.note }
  else delete i.c
  return JSON.stringify(i)
}

export function validateCounter(c: Counter): Partial<Record<'quantity' | 'unitCost' | 'note', string>> {
  const e = validateOffer({ ...c, arriveBy: '', note: '' }, '')
  const out: Partial<Record<'quantity' | 'unitCost' | 'note', string>> = {}
  if (e.quantity) out.quantity = e.quantity
  if (e.unitCost) out.unitCost = e.unitCost
  if (c.note.length > COUNTER_NOTE_MAX) out.note = `Keep the note under ${COUNTER_NOTE_MAX} characters.`
  return out
}

/** Every supplier offer in the ClothingCosts rows (admin side). */
export function offersFrom(costs: ClothingCost[]): SupplierOffer[] {
  return costs
    .filter((c) => c.costType === 'SupplierOffer')
    .map((c) => toOffer({ id: c.id, requestId: c.orderId, clothingId: c.clothingId, quantity: c.quantity, unitCost: c.unitCost, title: c.title, createdAt: c.createdAt }))
}

export function offerStatus(o: SupplierOffer, openRequestIds: Set<string>, acceptedKeys: Set<string>): OfferStatus {
  if (acceptedKeys.has(`BUY-${offerPurchaseId(o.id)}`)) return 'Accepted'
  return openRequestIds.has(o.requestId) ? 'Waiting' : 'Not needed'
}

export type OfferErrors = Partial<Record<'quantity' | 'unitCost' | 'arriveBy' | 'note', string>>

export function validateOffer(o: Omit<OfferInput, 'requestId'>, today: string): OfferErrors {
  const e: OfferErrors = {}
  if (Number.isNaN(o.quantity)) e.quantity = 'Enter how many pieces you can send.'
  else if (!Number.isInteger(o.quantity) || o.quantity < 1) e.quantity = 'Use a whole number, 1 or more.'
  else if (o.quantity > 100_000) e.quantity = 'That quantity looks too high.'
  if (Number.isNaN(o.unitCost)) e.unitCost = 'Enter your price per piece.'
  else if (o.unitCost < 0) e.unitCost = 'The price must be 0 or more.'
  else if (o.unitCost > 1_000_000) e.unitCost = 'That price looks too high.'
  else if (Math.abs(Math.round(o.unitCost * 100) - o.unitCost * 100) > 1e-6) e.unitCost = 'Use at most 2 decimal places.'
  if (o.arriveBy && !/^\d{4}-\d{2}-\d{2}$/.test(o.arriveBy)) e.arriveBy = 'Pick a date.'
  else if (o.arriveBy && o.arriveBy < today) e.arriveBy = "The date can't be in the past."
  if (o.note.length > NOTE_MAX) e.note = `Keep the note under ${NOTE_MAX} characters.`
  return e
}
