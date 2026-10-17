import type {
  AppNotification,
  AppUser,
  Clothing,
  ClothingCost,
  ClothingInput,
  NewOrderInput,
  Order,
  SalesSummary,
} from '../domain/types'

export class AccessDeniedError extends Error {
  constructor(message = 'You do not have access to this data.') {
    super(message)
    this.name = 'AccessDeniedError'
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

/**
 * The only way the UI touches data. A demo adapter and a SharePoint adapter
 * implement it. Admin-only methods must throw AccessDeniedError for customers
 * (SharePoint enforces this independently with list permissions).
 */
export interface ShopService {
  currentUser(): AppUser

  // Customer
  listClothes(): Promise<Clothing[]>
  /** Idempotent on requestId: resubmitting returns the existing order. */
  placeOrder(input: NewOrderInput): Promise<Order>
  listMyOrders(): Promise<Order[]>
  listMyNotifications(): Promise<AppNotification[]>
  markNotificationRead(id: string): Promise<void>

  // Admin
  saveClothing(input: ClothingInput): Promise<Clothing>
  listCosts(): Promise<ClothingCost[]>
  setCurrentCost(clothingId: string, unitCost: number): Promise<void>
  listAllOrders(): Promise<Order[]>
  getSalesSummary(): Promise<SalesSummary>
}

export function isTerminal(o: Pick<Order, 'processingStatus'>): boolean {
  return (
    o.processingStatus === 'Completed' ||
    o.processingStatus === 'Failed' ||
    o.processingStatus === 'NeedsReview'
  )
}

export function computeSummary(orders: Order[], costs: ClothingCost[]): SalesSummary {
  const confirmed = orders.filter((o) => o.status === 'Confirmed')
  const snapshots = new Map(
    costs.filter((c) => c.costType === 'SaleSnapshot').map((c) => [c.orderId, c]),
  )
  let revenue = 0
  let units = 0
  let cogs = 0
  for (const o of confirmed) {
    revenue += o.total
    units += o.quantity
    const snap = snapshots.get(o.id)
    if (snap) cogs += snap.unitCost * snap.quantity
  }
  const r = (n: number) => Math.round(n * 100) / 100
  return {
    confirmedRevenue: r(revenue),
    unitsSold: units,
    costOfGoodsSold: r(cogs),
    grossProfit: r(revenue - cogs),
    confirmedOrders: confirmed.length,
  }
}
