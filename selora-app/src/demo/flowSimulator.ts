import { stockCrossing } from '../domain/alerts'
import type { AppNotification, Clothing, Order, ProcessingStage } from '../domain/types'
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
    const note: AppNotification = {
      id: String(++this.db.seq),
      notificationKey: key,
      recipientEmail: recipient,
      type,
      message,
      orderId,
      isRead: false,
      createdAt: this.now(),
    }
    this.db.notifications.push(note)
    if (emailSubject) {
      // Email failure is isolated: it only sets EmailStatus, never touches the order.
      const failed = !!this.options.emailFails
      this.db.emails.push({
        to: recipient,
        subject: emailSubject,
        status: failed ? 'failed' : 'sent',
        at: this.now(),
      })
      note.emailStatus = failed ? 'Failed' : 'Sent'
    }
    this.changed()
  }

  private async run(orderId: string): Promise<void> {
    const order = this.db.orders.find((o) => o.id === orderId)
    // Idempotent trigger: only brand-new orders are processed.
    if (!order || order.status !== 'Pending' || order.processingStage !== 'New') return
    await this.pause()

    // Block while any other order is mid-flight or awaiting admin review.
    const blocker = this.db.orders.find(
      (o) => o.id !== order.id && (o.status === 'Processing' || o.status === 'NeedsReview'),
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
    const cost = this.db.costs.find((c) => c.recordKey === `CURRENT-${cloth.id}`)
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
    order.status = 'Processing'
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
      if (!this.db.costs.some((c) => c.recordKey === key)) {
        this.db.costs.push({
          id: String(++this.db.seq),
          recordKey: key,
          clothingId: cloth.id,
          costType: 'SaleCost',
          unitCost: cost.unitCost,
          orderId: order.id,
          quantity: qty,
        })
      }
      // There is no stage between StockUpdated and Completed, so an interruption
      // here is resolved by checking whether SALE-<id> exists (docs/recovery.md).
      this.checkpoint('Completed')

      order.status = 'Confirmed'
      order.processingStage = 'Completed'
      order.resultMessage = 'Order confirmed. Thank you!'
      this.changed()
    } catch {
      order.status = 'NeedsReview'
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
      this.stockAlert(cloth, order, stockBefore, stockAfter)
    } catch {
      /* best effort */
    }
  }

  private admins(): string[] {
    return this.db.users.filter((u) => u.role === 'Admin').map((u) => u.email)
  }

  private stockAlert(cloth: Clothing, order: Order, before: number, after: number): void {
    const crossing = stockCrossing(before, after, cloth.lowStockThreshold)
    if (crossing === 'none') return
    const type = crossing === 'zero' ? 'OutOfStock' : 'LowStock'
    const text =
      crossing === 'zero'
        ? `${cloth.name} is out of stock.`
        : `${cloth.name} is low on stock (${after} left).`
    for (const admin of this.admins()) {
      this.notify(
        admin,
        type,
        `STOCK-${cloth.id}-${crossing}-${order.id}-${admin}`,
        order.id,
        text,
        `Selora: ${text}`,
      )
    }
  }

  private checkpoint(stage: ProcessingStage): void {
    if (this.options.failAfter === stage) throw new Error(`Simulated interruption after ${stage}`)
  }
}
