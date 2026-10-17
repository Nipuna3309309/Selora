import type {
  AppNotification,
  AppUser,
  Clothing,
  ClothingCost,
  ClothingInput,
  NewOrderInput,
  Order,
  SalesSummary,
  StockAlertState,
} from '../domain/types'
import {
  AccessDeniedError,
  computeSummary,
  type ShopService,
} from '../services/ShopService'
import { stateAfterAdminEdit, validateClothingNumbers } from '../domain/alerts'
import type { FlowSimulator } from './flowSimulator'
import type { DemoDb } from './store'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/**
 * Demo adapter. It mimics the SharePoint permission model: customers only see
 * their own orders/notifications and cannot touch costs or write clothes.
 */
export class DemoShopService implements ShopService {
  private db: DemoDb
  private flow: FlowSimulator
  private user: AppUser
  private persist: () => void

  constructor(db: DemoDb, flow: FlowSimulator, user: AppUser, persist: () => void = () => undefined) {
    this.db = db
    this.flow = flow
    this.user = user
    this.persist = persist
  }

  currentUser(): AppUser {
    return this.user
  }

  private requireAdmin(): void {
    if (this.user.role !== 'Admin') throw new AccessDeniedError()
  }

  async listClothes(): Promise<Clothing[]> {
    return clone(this.db.clothes)
  }

  async placeOrder(input: NewOrderInput): Promise<Order> {
    const existing = this.db.orders.find((o) => o.requestId === input.requestId)
    if (existing) {
      // Unique RequestId: a retry returns the original order and never creates another.
      if (existing.createdByEmail !== this.user.email) throw new AccessDeniedError()
      return clone(existing)
    }
    const order: Order = {
      id: String(++this.db.seq),
      requestId: input.requestId,
      clothingId: input.clothingId,
      quantity: input.quantity,
      simulatedPayment: input.simulatedPayment,
      clothingName: '',
      unitPrice: 0,
      total: 0,
      stockBefore: null,
      stockAfter: null,
      status: 'Submitted',
      processingStatus: 'Pending',
      processingStage: 'Received',
      resultMessage: 'Waiting to be processed.',
      createdByEmail: this.user.email,
      createdAt: new Date().toISOString(),
    }
    this.db.orders.push(order)
    this.persist()
    // Equivalent of the "item created" trigger.
    void this.flow.enqueue(order.id)
    return clone(order)
  }

  async listMyOrders(): Promise<Order[]> {
    return clone(
      this.db.orders
        .filter((o) => o.createdByEmail === this.user.email)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }

  async listMyNotifications(): Promise<AppNotification[]> {
    return clone(
      this.db.notifications
        .filter((n) => n.recipientEmail === this.user.email)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }

  async markNotificationRead(id: string): Promise<void> {
    const n = this.db.notifications.find((x) => x.id === id)
    if (!n || n.recipientEmail !== this.user.email) throw new AccessDeniedError()
    n.isRead = true
    this.persist()
  }

  async saveClothing(input: ClothingInput): Promise<Clothing> {
    this.requireAdmin()
    if (!input.name.trim()) throw new Error('Name is required.')
    validateClothingNumbers(input.price, input.stock, input.lowStockThreshold)
    let item = input.id ? this.db.clothes.find((c) => c.id === input.id) : undefined
    const prev: StockAlertState = item?.stockAlertState ?? 'None'
    const base = { ...input, id: item?.id ?? String(++this.db.seq) }
    const next: Clothing = {
      ...base,
      stockAlertState: stateAfterAdminEdit(prev, input.stock, input.lowStockThreshold),
    }
    if (item) Object.assign(item, next)
    else {
      this.db.clothes.push(next)
      item = next
    }
    this.persist()
    return clone(item)
  }

  async listCosts(): Promise<ClothingCost[]> {
    this.requireAdmin()
    return clone(this.db.costs)
  }

  async setCurrentCost(clothingId: string, unitCost: number): Promise<void> {
    this.requireAdmin()
    if (!(unitCost >= 0)) throw new Error('Cost must be zero or more.')
    const key = `CURRENT-${clothingId}`
    const row = this.db.costs.find((c) => c.costKey === key)
    // Only the CURRENT row changes; SALE-<order> snapshots are never edited.
    if (row) row.unitCost = unitCost
    else
      this.db.costs.push({
        id: String(++this.db.seq),
        costKey: key,
        clothingId,
        costType: 'Current',
        unitCost,
        orderId: '',
        quantity: 0,
      })
    this.persist()
  }

  async listAllOrders(): Promise<Order[]> {
    this.requireAdmin()
    return clone([...this.db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  async getSalesSummary(): Promise<SalesSummary> {
    this.requireAdmin()
    return computeSummary(this.db.orders, this.db.costs)
  }
}
