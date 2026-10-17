import { beforeEach, describe, expect, it } from 'vitest'
import { AccessDeniedError } from '../services/ShopService'
import { DemoShopService } from './DemoShopService'
import { FlowSimulator } from './flowSimulator'
import { DEMO_USERS, seedDb, type DemoDb } from './store'

let db: DemoDb
let flow: FlowSimulator
const svc = (i: number) => new DemoShopService(db, flow, DEMO_USERS[i])
const c1 = () => svc(0)
const c2 = () => svc(1)
const admin = () => svc(2)
const stock = (id: string) => db.clothes.find((c) => c.id === id)!.stock
let n = 0
const buy = (s: DemoShopService, clothingId: string, quantity = 1, pay: 'Success' | 'Failure' = 'Success', requestId = `req-${++n}`) =>
  s.placeOrder({ requestId, clothingId, quantity, simulatedPayment: pay })

beforeEach(() => {
  db = seedDb()
  flow = new FlowSimulator(db)
})

describe('purchases', () => {
  it('confirms a successful order, deducts stock and snapshots the cost', async () => {
    const o = await buy(c1(), '1', 2)
    await flow.idle()
    const stored = db.orders.find((x) => x.id === o.id)!
    expect(stored.status).toBe('Confirmed')
    expect(stored.processingStatus).toBe('Completed')
    expect(stored.total).toBe(13000)
    expect(stored.stockBefore).toBe(12)
    expect(stored.stockAfter).toBe(10)
    expect(stock('1')).toBe(10)
    const snap = db.costs.find((c) => c.costKey === `SALE-${o.id}`)!
    expect(snap.unitCost).toBe(3800)
    expect(snap.quantity).toBe(2)
    expect(db.notifications.filter((x) => x.recipientEmail === DEMO_USERS[0].email)).toHaveLength(1)
    expect(db.emails.some((e) => e.to === DEMO_USERS[0].email && e.status === 'sent')).toBe(true)
  })

  it('rejects a failed payment without touching stock or costs', async () => {
    await buy(c1(), '1', 2, 'Failure')
    await flow.idle()
    expect(db.orders[0].status).toBe('Rejected')
    expect(stock('1')).toBe(12)
    expect(db.costs.some((c) => c.costType === 'SaleSnapshot')).toBe(false)
  })

  it('rejects insufficient stock, inactive items and bad quantities', async () => {
    await buy(c1(), '3', 5) // only 4 in stock
    await buy(c1(), '6', 1) // inactive
    await buy(c1(), '1', 0)
    await buy(c1(), '1', 99)
    await buy(c1(), '1', 1.5)
    await flow.idle()
    expect(db.orders.every((o) => o.status === 'Rejected')).toBe(true)
    expect(db.orders[0].resultMessage).toMatch(/Insufficient stock/)
    expect(stock('3')).toBe(4)
    expect(stock('1')).toBe(12)
  })

  it('does not create or deduct twice for a repeated RequestId', async () => {
    const [a, b] = await Promise.all([
      buy(c1(), '1', 1, 'Success', 'same'),
      buy(c1(), '1', 1, 'Success', 'same'),
    ])
    await flow.idle()
    expect(a.id).toBe(b.id)
    expect(db.orders).toHaveLength(1)
    expect(stock('1')).toBe(11)
    // A different user cannot hijack the key.
    await expect(buy(c2(), '1', 1, 'Success', 'same')).rejects.toBeInstanceOf(AccessDeniedError)
  })

  it('lets only one of two customers buy the last item', async () => {
    await Promise.all([buy(c1(), '4'), buy(c2(), '4')])
    await flow.idle()
    expect(db.orders.filter((o) => o.status === 'Confirmed')).toHaveLength(1)
    expect(db.orders.filter((o) => o.status === 'Rejected')).toHaveLength(1)
    expect(stock('4')).toBe(0)
  })

  it('ignores a tampered price: the flow uses the current price', async () => {
    const s = c1()
    const o = await s.placeOrder({
      requestId: 'tamper',
      clothingId: '2',
      quantity: 1,
      simulatedPayment: 'Success',
      ...({ total: 1, unitPrice: 1 } as object),
    })
    await flow.idle()
    expect(db.orders.find((x) => x.id === o.id)!.total).toBe(3200)
  })
})

describe('roles and data access', () => {
  it('keeps customers away from other data and admin features', async () => {
    const o = await buy(c1(), '1')
    await flow.idle()
    expect(await c2().listMyOrders()).toHaveLength(0)
    expect(await c1().listMyOrders()).toHaveLength(1)
    const mine = await c1().listMyNotifications()
    await expect(c2().markNotificationRead(mine[0].id)).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(c1().listCosts()).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(c1().setCurrentCost('1', 1)).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(c1().listAllOrders()).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(c1().getSalesSummary()).rejects.toBeInstanceOf(AccessDeniedError)
    await expect(
      c1().saveClothing({ ...db.clothes[0], price: 1 }),
    ).rejects.toBeInstanceOf(AccessDeniedError)
    expect((await admin().listAllOrders()).map((x) => x.id)).toContain(o.id)
  })
})

describe('stock alerts', () => {
  it('alerts once on low, once on zero, and re-arms after recovery', async () => {
    const adminAlerts = () => db.notifications.filter((x) => x.recipientEmail === DEMO_USERS[2].email)
    await buy(c1(), '3', 1) // 4 -> 3 (threshold 3): low
    await flow.idle()
    expect(adminAlerts().filter((x) => x.type === 'LowStock')).toHaveLength(1)
    await buy(c1(), '3', 1) // 3 -> 2: still low, no repeat
    await flow.idle()
    expect(adminAlerts()).toHaveLength(1)
    await buy(c1(), '3', 2) // 2 -> 0: zero
    await flow.idle()
    expect(adminAlerts().filter((x) => x.type === 'OutOfStock')).toHaveLength(1)

    await admin().saveClothing({ ...db.clothes.find((c) => c.id === '3')!, stock: 10 })
    expect(db.clothes.find((c) => c.id === '3')!.stockAlertState).toBe('None')
    await buy(c1(), '3', 8) // 10 -> 2: crosses again
    await flow.idle()
    expect(adminAlerts().filter((x) => x.type === 'LowStock')).toHaveLength(2)
  })
})

describe('historical cost snapshots', () => {
  it('keeps old profit stable when cost or price changes', async () => {
    await buy(c1(), '2', 2) // cost 1700, price 3200
    await flow.idle()
    const first = await admin().getSalesSummary()
    expect(first).toMatchObject({ confirmedRevenue: 6400, unitsSold: 2, costOfGoodsSold: 3400, grossProfit: 3000 })

    await admin().setCurrentCost('2', 2500)
    await admin().saveClothing({ ...db.clothes.find((c) => c.id === '2')!, price: 4000 })
    expect(await admin().getSalesSummary()).toEqual(first)

    await buy(c2(), '2', 1) // new sale uses new cost and price
    await flow.idle()
    const second = await admin().getSalesSummary()
    expect(second).toMatchObject({ confirmedRevenue: 10400, costOfGoodsSold: 5900, grossProfit: 4500 })
  })

  it('excludes rejected orders from revenue', async () => {
    await buy(c1(), '2', 1, 'Failure')
    await flow.idle()
    expect((await admin().getSalesSummary()).confirmedRevenue).toBe(0)
  })
})

describe('reliability', () => {
  it.each(['Prepared', 'StockUpdated', 'SnapshotCreated'] as const)(
    'marks an order interrupted after %s as NeedsReview and blocks further processing',
    async (stage) => {
      flow.options.failAfter = stage
      const o = await buy(c1(), '1', 2)
      await flow.idle()
      flow.options.failAfter = null
      const stored = db.orders.find((x) => x.id === o.id)!
      expect(stored.processingStatus).toBe('NeedsReview')
      expect(stored.status).not.toBe('Confirmed')
      expect(db.notifications.some((x) => x.type === 'NeedsReview')).toBe(true)

      // A later order must not touch stock while the review is open.
      const before = stock('2')
      const later = await buy(c2(), '2', 1)
      await flow.idle()
      expect(db.orders.find((x) => x.id === later.id)!.status).toBe('Rejected')
      expect(stock('2')).toBe(before)
      // The interrupted order's stock is deducted at most once.
      expect(stock('1')).toBe(stage === 'Prepared' ? 12 : 10)
      // Never more than one snapshot per order.
      expect(db.costs.filter((c) => c.costKey === `SALE-${o.id}`).length).toBeLessThanOrEqual(1)
    },
  )

  it('does not re-process an already handled order when the trigger replays', async () => {
    const o = await buy(c1(), '1', 1)
    await flow.idle()
    await flow.enqueue(o.id)
    expect(stock('1')).toBe(11)
    expect(db.costs.filter((c) => c.costKey === `SALE-${o.id}`)).toHaveLength(1)
  })

  it('keeps the order confirmed when email fails', async () => {
    flow.options.emailFails = true
    const o = await buy(c1(), '1', 1)
    await flow.idle()
    expect(db.orders.find((x) => x.id === o.id)!.status).toBe('Confirmed')
    expect(db.emails.every((e) => e.status === 'failed')).toBe(true)
    expect(db.notifications.some((x) => x.type === 'OrderConfirmed')).toBe(true)
  })
})
