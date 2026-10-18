import { businessDate, round2, todayBusinessDate } from './format'
import type { Clothing, ClothingCost, Order } from './types'

/**
 * The Sales page: every confirmed sale since the shop opened. Cost is the one recorded at the
 * time of each sale (SALE-<orderId>), so later cost changes never rewrite past profit.
 */

export interface SalesPoint {
  /** YYYY-MM-DD for days, YYYY-MM for months. */
  key: string
  revenue: number
  profit: number
  orders: number
}

export interface SalesRow {
  id: string
  name: string
  revenue: number
  profit: number
  units: number
  /** Profit as a share of sales, or null with no sales. */
  margin: number | null
}

export interface RecentSale {
  orderId: string
  date: string
  customer: string
  item: string
  quantity: number
  total: number
  cost: number | null
  profit: number | null
}

export interface Sales {
  revenue: number
  cogs: number
  profit: number
  margin: number | null
  units: number
  orders: number
  /** Average sale per order (one order row per cart line). */
  aov: number | null
  /** Days while the history is short, months once it's longer than about two months. */
  granularity: 'day' | 'month'
  series: SalesPoint[]
  items: SalesRow[]
  categories: SalesRow[]
  /** Units sold per size, most first: what to reorder more of. */
  sizes: { size: string; units: number }[]
  payments: { label: string; orders: number; revenue: number }[]
  recent: RecentSale[]
}

const DAY_MS = 86_400_000
const DAILY_UP_TO = 62

const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10)
const nextMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
}

function rows(map: Map<string, { name: string; revenue: number; profit: number; units: number }>): SalesRow[] {
  return [...map.entries()]
    .map(([id, r]) => ({
      id,
      name: r.name,
      revenue: round2(r.revenue),
      profit: round2(r.profit),
      units: r.units,
      margin: r.revenue > 0 ? r.profit / r.revenue : null,
    }))
    .sort((a, b) => b.profit - a.profit)
}

export function buildSales(orders: Order[], clothes: Clothing[], costs: ClothingCost[], today = todayBusinessDate()): Sales {
  const confirmed = orders.filter((o) => o.status === 'Confirmed')
  const snapshots = new Map(costs.filter((c) => c.costType === 'SaleCost').map((c) => [c.orderId, c]))
  const byId = new Map(clothes.map((c) => [c.id, c]))
  const costOf = (o: Order) => {
    const s = snapshots.get(o.id)
    return s ? s.unitCost * s.quantity : null
  }

  let revenue = 0
  let cogs = 0
  let units = 0
  const items = new Map<string, { name: string; revenue: number; profit: number; units: number }>()
  const cats = new Map<string, { name: string; revenue: number; profit: number; units: number }>()
  const pay = new Map<string, { orders: number; revenue: number }>()
  const sizes = new Map<string, number>()
  const dated = confirmed.map((o) => ({ o, date: businessDate(o.createdAt) }))

  for (const { o } of dated) {
    const cost = costOf(o) ?? 0
    revenue += o.total
    cogs += cost
    units += o.quantity
    const name = o.clothingName || byId.get(o.clothingId)?.name || `Item ${o.clothingId}`
    const it = items.get(o.clothingId) ?? { name, revenue: 0, profit: 0, units: 0 }
    items.set(o.clothingId, { ...it, revenue: it.revenue + o.total, profit: it.profit + o.total - cost, units: it.units + o.quantity })
    const cat = byId.get(o.clothingId)?.category || 'Other'
    const k = cats.get(cat) ?? { name: cat, revenue: 0, profit: 0, units: 0 }
    cats.set(cat, { ...k, revenue: k.revenue + o.total, profit: k.profit + o.total - cost, units: k.units + o.quantity })
    const size = byId.get(o.clothingId)?.size || 'Unknown'
    sizes.set(size, (sizes.get(size) ?? 0) + o.quantity)
    const label = o.simulatedPayment === 'Cash on delivery' ? 'Cash on delivery' : 'Paid now'
    const p = pay.get(label) ?? { orders: 0, revenue: 0 }
    pay.set(label, { orders: p.orders + 1, revenue: p.revenue + o.total })
  }

  // One point per day or month from the first sale to today, empty ones included, so gaps show.
  const first = dated.reduce((m, d) => (d.date < m ? d.date : m), today)
  const granularity = (Date.parse(today) - Date.parse(first)) / DAY_MS <= DAILY_UP_TO ? 'day' : 'month'
  const keyOf = (date: string) => (granularity === 'day' ? date : date.slice(0, 7))
  const series = new Map<string, SalesPoint>()
  if (dated.length > 0) {
    const end = keyOf(today)
    for (let k = keyOf(first); k <= end; k = granularity === 'day' ? addDays(k, 1) : nextMonth(k))
      series.set(k, { key: k, revenue: 0, profit: 0, orders: 0 })
  }
  for (const { o, date } of dated) {
    const pt = series.get(keyOf(date))
    if (!pt) continue
    pt.revenue += o.total
    pt.profit += o.total - (costOf(o) ?? 0)
    pt.orders++
  }

  const recent = [...confirmed]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12)
    .map((o) => {
      const cost = costOf(o)
      return {
        orderId: o.id,
        date: o.createdAt,
        customer: o.createdByEmail,
        item: o.clothingName || byId.get(o.clothingId)?.name || `Item ${o.clothingId}`,
        quantity: o.quantity,
        total: o.total,
        cost,
        profit: cost === null ? null : round2(o.total - cost),
      }
    })

  return {
    revenue: round2(revenue),
    cogs: round2(cogs),
    profit: round2(revenue - cogs),
    margin: revenue > 0 ? (revenue - cogs) / revenue : null,
    units,
    orders: confirmed.length,
    aov: confirmed.length ? round2(revenue / confirmed.length) : null,
    granularity,
    series: [...series.values()].map((p) => ({ ...p, revenue: round2(p.revenue), profit: round2(p.profit) })),
    items: rows(items),
    categories: rows(cats),
    sizes: [...sizes.entries()].map(([size, units]) => ({ size, units })).sort((a, b) => b.units - a.units),
    payments: [...pay.entries()].map(([label, p]) => ({ label, orders: p.orders, revenue: round2(p.revenue) })),
    recent,
  }
}
