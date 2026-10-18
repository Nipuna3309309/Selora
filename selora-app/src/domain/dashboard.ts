import { businessDate, round2, todayBusinessDate } from './format'
import type { Clothing, ClothingCost, Order } from './types'

/**
 * Everything the owner's dashboard shows, computed from the same three lists the
 * rest of the admin screens use. Money is confirmed sales only; gross profit uses
 * the cost recorded at the time of each sale (SALE-<orderId>), like the Sales screen.
 */

export type RangeDays = 7 | 30 | 90
export type Severity = 'critical' | 'warning' | 'info'
export type AdminSection = 'clothes' | 'costs' | 'all-orders' | 'sales'

export interface Totals {
  revenue: number
  cogs: number
  profit: number
  /** Gross margin 0..1, or null with no sales. */
  margin: number | null
  confirmed: number
  units: number
  aov: number | null
  rejected: number
  /** Value of orders that were not placed, at today's prices. */
  lostValue: number
}

export interface Day {
  date: string
  revenue: number
  profit: number
  orders: number
}

export interface ItemPerformance {
  id: string
  name: string
  revenue: number
  profit: number
  units: number
  margin: number | null
}

export interface Outcome {
  key: 'confirmed' | 'stock' | 'payment' | 'other' | 'open'
  label: string
  count: number
}

export interface Decision {
  id: string
  severity: Severity
  title: string
  detail: string
  /** LKR at stake, used for ranking and shown when known. */
  impact: number
  impactLabel?: string
  action: string
  target: AdminSection
}

export interface Dashboard {
  range: RangeDays
  from: string
  to: string
  now: Totals
  before: Totals
  days: Day[]
  topItems: ItemPerformance[]
  categories: { name: string; revenue: number }[]
  outcomes: Outcome[]
  stockValue: number
  decisions: Decision[]
}

const DAY_MS = 86_400_000
const COVER_TARGET_DAYS = 14
const REORDER_TO_DAYS = 30
const THIN_MARGIN = 0.25

const addDays = (date: string, n: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10)

type Reason = 'stock' | 'payment' | 'cost' | 'other'

/** Why the flow rejected an order, from its fixed result messages. */
function rejectReason(o: Order): Reason {
  if (o.simulatedPayment === 'Failed') return 'payment'
  if (/stock/i.test(o.resultMessage)) return 'stock'
  if (/temporarily unavailable/i.test(o.resultMessage)) return 'cost'
  return 'other'
}

function totals(orders: Order[], snapshots: Map<string, ClothingCost>, priceOf: (id: string) => number): Totals {
  let revenue = 0
  let cogs = 0
  let units = 0
  let confirmed = 0
  let rejected = 0
  let lostValue = 0
  for (const o of orders) {
    if (o.status === 'Confirmed') {
      confirmed++
      revenue += o.total
      units += o.quantity
      const s = snapshots.get(o.id)
      if (s) cogs += s.unitCost * s.quantity
    } else if (o.status === 'Rejected') {
      rejected++
      lostValue += o.quantity * priceOf(o.clothingId)
    }
  }
  return {
    revenue: round2(revenue),
    cogs: round2(cogs),
    profit: round2(revenue - cogs),
    margin: revenue > 0 ? (revenue - cogs) / revenue : null,
    confirmed,
    units,
    aov: confirmed > 0 ? round2(revenue / confirmed) : null,
    rejected,
    lostValue: round2(lostValue),
  }
}

const list = (names: string[], max = 3): string =>
  names.length <= max ? names.join(', ') : `${names.slice(0, max).join(', ')} and ${names.length - max} more`

export function buildDashboard(
  orders: Order[],
  clothes: Clothing[],
  costs: ClothingCost[],
  range: RangeDays,
  today: string = todayBusinessDate(),
): Dashboard {
  const from = addDays(today, -(range - 1))
  const prevFrom = addDays(from, -range)
  const dateOf = new Map(orders.map((o) => [o.id, businessDate(o.createdAt)]))
  const inNow = orders.filter((o) => dateOf.get(o.id)! >= from && dateOf.get(o.id)! <= today)
  const inBefore = orders.filter((o) => dateOf.get(o.id)! >= prevFrom && dateOf.get(o.id)! < from)

  const byId = new Map(clothes.map((c) => [c.id, c]))
  const priceOf = (id: string) => byId.get(id)?.price ?? 0
  const snapshots = new Map(costs.filter((c) => c.costType === 'SaleCost').map((c) => [c.orderId, c]))
  const currentCost = new Map(
    costs.filter((c) => c.costType === 'CurrentCost').map((c) => [c.clothingId, c.unitCost]),
  )

  // Daily series
  const dayMap = new Map<string, Day>()
  for (let i = 0; i < range; i++) {
    const date = addDays(from, i)
    dayMap.set(date, { date, revenue: 0, profit: 0, orders: 0 })
  }
  // Per item and per category
  const items = new Map<string, ItemPerformance>()
  const cats = new Map<string, number>()
  const stockMisses = new Map<string, { orders: number; value: number }>()
  const costMisses = new Map<string, number>()

  for (const o of inNow) {
    if (o.status === 'Confirmed') {
      const snap = snapshots.get(o.id)
      const cost = snap ? snap.unitCost * snap.quantity : 0
      const d = dayMap.get(dateOf.get(o.id)!)
      if (d) {
        d.revenue += o.total
        d.profit += o.total - cost
        d.orders++
      }
      const it = items.get(o.clothingId) ?? {
        id: o.clothingId,
        name: o.clothingName || byId.get(o.clothingId)?.name || `Item ${o.clothingId}`,
        revenue: 0,
        profit: 0,
        units: 0,
        margin: null,
      }
      it.revenue += o.total
      it.profit += o.total - cost
      it.units += o.quantity
      items.set(o.clothingId, it)
      const cat = byId.get(o.clothingId)?.category || 'Other'
      cats.set(cat, (cats.get(cat) ?? 0) + o.total)
    } else if (o.status === 'Rejected') {
      const reason = rejectReason(o)
      const value = o.quantity * priceOf(o.clothingId)
      if (reason === 'stock') {
        const m = stockMisses.get(o.clothingId) ?? { orders: 0, value: 0 }
        stockMisses.set(o.clothingId, { orders: m.orders + 1, value: m.value + value })
      } else if (reason === 'cost') {
        costMisses.set(o.clothingId, (costMisses.get(o.clothingId) ?? 0) + value)
      }
    }
  }
  const performance = [...items.values()].map((i) => ({
    ...i,
    revenue: round2(i.revenue),
    profit: round2(i.profit),
    margin: i.revenue > 0 ? i.profit / i.revenue : null,
  }))

  // Outcomes of every order placed in the period
  const outcome = { confirmed: 0, stock: 0, payment: 0, other: 0, open: 0 }
  for (const o of inNow) {
    if (o.status === 'Confirmed') outcome.confirmed++
    else if (o.status === 'Rejected') {
      const r = rejectReason(o)
      outcome[r === 'cost' ? 'other' : r]++
    } else outcome.open++
  }

  // Decisions, most urgent first
  const decisions: Decision[] = []
  const active = clothes.filter((c) => c.isActive)

  const stuck = orders.filter((o) => o.status === 'NeedsReview')
  if (stuck.length > 0) {
    decisions.push({
      id: 'review',
      severity: 'critical',
      title: `Resolve ${stuck.length} stuck ${stuck.length === 1 ? 'order' : 'orders'}`,
      detail: `Order ${list(stuck.map((o) => o.id))} stopped mid-processing. Every new order is rejected until this is cleared.`,
      impact: Number.MAX_SAFE_INTEGER,
      impactLabel: 'All sales blocked',
      action: 'Open all orders',
      target: 'all-orders',
    })
  }

  const noCost = active.filter((c) => !currentCost.has(c.id))
  if (noCost.length > 0) {
    const lost = noCost.reduce((s, c) => s + (costMisses.get(c.id) ?? 0), 0)
    decisions.push({
      id: 'cost',
      severity: 'critical',
      title: `Set the buying cost for ${noCost.length} ${noCost.length === 1 ? 'item' : 'items'}`,
      detail: `${list(noCost.map((c) => c.name))} can't be sold until a cost is set: the flow rejects those orders.`,
      impact: lost,
      impactLabel: lost > 0 ? `${lkrShort(lost)} turned away` : undefined,
      action: 'Set costs',
      target: 'costs',
    })
  }

  for (const c of active) {
    const sold = items.get(c.id)?.units ?? 0
    const perDay = sold / range
    const missed = stockMisses.get(c.id)
    const cost = currentCost.get(c.id)

    if (c.stock <= 0 && (sold > 0 || missed)) {
      decisions.push({
        id: `out-${c.id}`,
        severity: 'critical',
        title: `Restock ${c.name}: sold out`,
        detail: `${sold} sold in the last ${range} days${missed ? `, ${missed.orders} more turned away for lack of stock` : ''}. Suggested order: ${Math.max(1, Math.ceil(perDay * REORDER_TO_DAYS))} units.`,
        impact: (missed?.value ?? 0) + perDay * COVER_TARGET_DAYS * c.price,
        impactLabel: missed ? `${lkrShort(missed.value)} turned away` : undefined,
        action: 'Update stock',
        target: 'clothes',
      })
    } else if (c.stock > 0 && perDay > 0) {
      const cover = c.stock / perDay
      if (cover < COVER_TARGET_DAYS) {
        const atRisk = (COVER_TARGET_DAYS - cover) * perDay * c.price
        decisions.push({
          id: `low-${c.id}`,
          severity: 'warning',
          title: `Reorder ${c.name}: about ${Math.max(1, Math.floor(cover))} days left`,
          detail: `Selling ${perDay < 1 ? perDay.toFixed(1) : Math.round(perDay)} a day with ${c.stock} in stock. Order ${Math.max(1, Math.ceil(perDay * REORDER_TO_DAYS - c.stock))} units to cover a month.`,
          impact: atRisk,
          impactLabel: `${lkrShort(atRisk)} at risk in 2 weeks`,
          action: 'Update stock',
          target: 'clothes',
        })
      }
    }

    if (cost !== undefined && c.price > 0) {
      const margin = (c.price - cost) / c.price
      if (margin <= 0) {
        decisions.push({
          id: `loss-${c.id}`,
          severity: 'critical',
          title: `${c.name} sells at a loss`,
          detail: `Price ${lkrShort(c.price)}, cost ${lkrShort(cost)}. Each sale loses ${lkrShort(cost - c.price)}. Raise the price or stop selling it.`,
          impact: (cost - c.price) * Math.max(1, sold) + 1,
          action: 'Edit price',
          target: 'clothes',
        })
      } else if (margin < THIN_MARGIN) {
        decisions.push({
          id: `thin-${c.id}`,
          severity: 'warning',
          title: `Review the price of ${c.name}`,
          detail: `Margin is ${Math.round(margin * 100)}% (price ${lkrShort(c.price)}, cost ${lkrShort(cost)}), under the ${THIN_MARGIN * 100}% floor.`,
          impact: sold * c.price * (THIN_MARGIN - margin),
          action: 'Edit price',
          target: 'clothes',
        })
      }
    }
  }

  const idle = active.filter((c) => c.stock > 0 && !items.has(c.id))
  if (range >= 30 && idle.length > 0) {
    const tied = idle.reduce((s, c) => s + c.stock * (currentCost.get(c.id) ?? 0), 0)
    decisions.push({
      id: 'idle',
      severity: 'info',
      title: `${idle.length} ${idle.length === 1 ? 'item hasn’t' : 'items haven’t'} sold in ${range} days`,
      detail: `${list(idle.map((c) => c.name))}. Consider a discount or stop reordering them.`,
      impact: tied,
      impactLabel: tied > 0 ? `${lkrShort(tied)} tied up at cost` : undefined,
      action: 'Review clothes',
      target: 'clothes',
    })
  }

  const rank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  decisions.sort((a, b) => rank[a.severity] - rank[b.severity] || b.impact - a.impact)

  return {
    range,
    from,
    to: today,
    now: totals(inNow, snapshots, priceOf),
    before: totals(inBefore, snapshots, priceOf),
    days: [...dayMap.values()].map((d) => ({ ...d, revenue: round2(d.revenue), profit: round2(d.profit) })),
    topItems: performance.sort((a, b) => b.profit - a.profit).slice(0, 6),
    categories: [...cats.entries()]
      .map(([name, revenue]) => ({ name, revenue: round2(revenue) }))
      .sort((a, b) => b.revenue - a.revenue),
    outcomes: [
      { key: 'confirmed', label: 'Confirmed', count: outcome.confirmed },
      { key: 'stock', label: 'Not placed: no stock', count: outcome.stock },
      { key: 'payment', label: 'Not placed: payment failed', count: outcome.payment },
      { key: 'other', label: 'Not placed: other', count: outcome.other },
      { key: 'open', label: 'Still processing', count: outcome.open },
    ],
    stockValue: round2(active.reduce((s, c) => s + Math.max(0, c.stock) * (currentCost.get(c.id) ?? 0), 0)),
    decisions,
  }
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
/** "LKR 12.4K": for figures read at a glance; exact values stay in tables and tooltips. */
export const lkrShort = (n: number): string => `LKR ${compact.format(Math.round(n))}`
export const compactNumber = (n: number): string => compact.format(n)

/** Up to 12 buckets, so a 90-day range still reads as a short trend. */
export function bucket(values: number[], count = 12): number[] {
  if (values.length <= count) return values
  const size = values.length / count
  return Array.from({ length: count }, (_, k) =>
    values.slice(Math.floor(k * size), Math.floor((k + 1) * size)).reduce((s, v) => s + v, 0),
  )
}
