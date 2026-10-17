import type { AppNotification, Clothing, Order, ProcessingStage, StockAlertState } from '../domain/types'
import type { DemoDb } from './store'

/**
 * Local simulation of the single Power Automate flow. It follows the same
 * steps as docs/power-automate-flow.md, so the demo behaves like the live app.
 * Cross-list updates are NOT atomic here either: each step is a separate write
 * and an interruption leaves the order NeedsReview.
 */
export interface FlowOptions {
  delayMs?: number
  /** Test hook: throw right after this stage is written, simulating an interruption. */
  failAfter?: ProcessingStage | null
  /** Test hook: make every email attempt fail. */
  emailFails?: boolean
  onChange?: () => void
  now?: () => string
}

export const MAX_QTY = 10
const ALERT_RANK: Record<StockAlertState, number> = { None: 0, Low: 1, Zero: 2 }

export class FlowSimulator {
  private queue: Promise<void> = Promise.resolve()
  private db: DemoDb
  options: FlowOptions

  constructor(db: DemoDb, options: FlowOptions = {}) {
    this.db = db
    this.options = options
  }

  /** Trigger concurrency = 1: runs are strictly serialized. */
  enqueue(orderId: string): Promise<void> {
    this.queue = this.queue.then(() => this.run(orderId)).catch(() => undefined)
    return this.queue
  }

  idle(): Promise<void> {
    return this.queue
  }

  private now(): string {
    return (this.options.now ?? (() => new Date().toISOString()))()
  }
  private changed(): void {
    this.options.onChange?.()
  }
  private async pause(): Promise<void> {
    if (this.options.delayMs) await new Promise((r) => setTimeout(r, this.options.delayMs))
  }

  private reject(order: Order, message: string): void {
    order.status = 'Rejected'
    order.processingStatus = 'Failed'
    order.resultMessage = message
    this.notify(
      order.createdByEmail,
      'OrderRejected',
      `ORDER-${order.id}-REJECTED`,
      order.id,
      `Order ${order.id} was not placed: ${message}`,
    )
    this.changed()
  }

  private notify(
    recipient: string,
    type: AppNotification['type'],
    key: string,
    orderId: string,
    message: string,
    emailSubject?: string,
  ): void {
    // Unique key => replays cannot create duplicate notifications.
    if (this.db.notifications.some((n) => n.notificationKey === key)) return
    this.db.notifications.push({
      id: String(++this.db.seq),
      notificationKey: key,
      recipientEmail: recipient,
      type,
      message,
      orderId,
      isRead: false,
      createdAt: this.now(),
    })
    if (emailSubject) {
      // Email failure is isolated: it never throws into order processing.
      this.db.emails.push({
        to: recipient,
        subject: emailSubject,
        status: this.options.emailFails ? 'failed' : 'sent',
        at: this.now(),
      })
    }
    this.changed()
  }

  private async run(orderId: string): Promise<void> {
    const order = this.db.orders.find((o) => o.id === orderId)
    // Idempotent trigger: only brand-new orders are processed.
    if (!order || order.processingStatus !== 'Pending') return
    await this.pause()

    // Block while any other order is mid-flight or awaiting admin review.
    const blocker = this.db.orders.find(
      (o) =>
        o.id !== order.id &&
        (o.processingStatus === 'Processing' || o.processingStatus === 'NeedsReview'),
    )
    if (blocker) {
      return this.reject(
        order,
        'Order processing is paused while an earlier order is being reviewed. Please try again later.',
      )
    }

    const qty = order.quantity
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      return this.reject(order, `Quantity must be a whole number from 1 to ${MAX_QTY}.`)
    }
    if (order.simulatedPayment !== 'Success') {
      return this.reject(order, 'Simulated payment failed. No stock was deducted.')
    }
    const cloth = this.db.clothes.find((c) => c.id === order.clothingId)
    if (!cloth || !cloth.isActive) return this.reject(order, 'This item is not available.')
    const cost = this.db.costs.find((c) => c.costKey === `CURRENT-${cloth.id}`)
    if (!cost) return this.reject(order, 'This item is temporarily unavailable.')
    if (cloth.stock < qty) {
      return this.reject(order, `Insufficient stock. Only ${cloth.stock} available.`)
    }

    // Authoritative values are re-read here; client-supplied ones are ignored.
    const stockBefore = cloth.stock
    const stockAfter = stockBefore - qty
    order.clothingName = cloth.name
    order.unitPrice = cloth.price
    order.total = Math.round(cloth.price * qty * 100) / 100
    order.stockBefore = stockBefore
    order.stockAfter = stockAfter
    order.processingStatus = 'Processing'
    order.processingStage = 'Prepared'
    this.changed()

    try {
      this.checkpoint('Prepared')
      // Absolute write of the recorded StockAfter value, never "stock - qty".
      if (cloth.stock === stockBefore) cloth.stock = stockAfter
      else if (cloth.stock !== stockAfter) throw new Error('Stock changed during processing')
      order.processingStage = 'StockUpdated'
      this.changed()
      this.checkpoint('StockUpdated')

      const key = `SALE-${order.id}`
      if (!this.db.costs.some((c) => c.costKey === key)) {
        this.db.costs.push({
          id: String(++this.db.seq),
          costKey: key,
          clothingId: cloth.id,
          costType: 'SaleSnapshot',
          unitCost: cost.unitCost,
          orderId: order.id,
          quantity: qty,
        })
      }
      order.processingStage = 'SnapshotCreated'
      this.changed()
      this.checkpoint('SnapshotCreated')

      order.status = 'Confirmed'
      order.processingStatus = 'Completed'
      order.processingStage = 'Confirmed'
      order.resultMessage = 'Order confirmed. Thank you!'
      this.changed()
    } catch {
      order.processingStatus = 'NeedsReview'
      order.resultMessage =
        'Processing was interrupted and needs admin review. Payment is simulated; nothing was charged.'
      for (const admin of this.admins()) {
        this.notify(
          admin,
          'NeedsReview',
          `REVIEW-${order.id}-${admin}`,
          order.id,
          `Order ${order.id} needs review. Stock processing is blocked until it is resolved.`,
        )
      }
      this.changed()
      return
    }

    // Everything below happens after the order is confirmed; failures cannot undo it.
    try {
      this.notify(
        order.createdByEmail,
        'OrderConfirmed',
        `ORDER-${order.id}-CONFIRMED`,
        order.id,
        `Order ${order.id} confirmed: ${qty} x ${cloth.name}.`,
        `Selora order ${order.id} confirmed`,
      )
      this.stockAlert(cloth, order)
    } catch {
      /* best effort */
    }
  }

  private admins(): string[] {
    return this.db.users.filter((u) => u.role === 'Admin').map((u) => u.email)
  }

  private stockAlert(cloth: Clothing, order: Order): void {
    const next: StockAlertState =
      cloth.stock <= 0 ? 'Zero' : cloth.stock <= cloth.lowStockThreshold ? 'Low' : 'None'
    if (ALERT_RANK[next] <= ALERT_RANK[cloth.stockAlertState]) return
    const type = next === 'Zero' ? 'OutOfStock' : 'LowStock'
    const text =
      next === 'Zero'
        ? `${cloth.name} is out of stock.`
        : `${cloth.name} is low on stock (${cloth.stock} left).`
    for (const admin of this.admins()) {
      this.notify(
        admin,
        type,
        `STOCK-${cloth.id}-${next}-${order.id}-${admin}`,
        order.id,
        text,
        `Selora: ${text}`,
      )
    }
    cloth.stockAlertState = next
    this.changed()
  }

  private checkpoint(stage: ProcessingStage): void {
    if (this.options.failAfter === stage) throw new Error(`Simulated interruption after ${stage}`)
  }
}
