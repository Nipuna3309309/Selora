import type {
  AppNotification,
  AppUser,
  CheckoutInput,
  Clothing,
  ClothingCost,
  ClothingInput,
  NewOrderInput,
  Order,
  RestockRequest,
  SalesSummary,
  Supplier,
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
 * The only way the UI touches data. The SharePoint adapter (LiveShopService)
 * implements it. Admin-only methods must throw AccessDeniedError for customers
 * (SharePoint enforces this independently with list permissions).
 */
export interface ShopService {
  currentUser(): AppUser
  /** Something an <img> can show for a clothing PhotoUrl (library photos are loaded through the connector). */
  photoSrc(photoUrl: string): Promise<string>

  // Customer
  listClothes(): Promise<Clothing[]>
  /** Idempotent on requestId: resubmitting returns the existing order. */
  placeOrder(input: NewOrderInput): Promise<Order>
  /** Places one order row per cart line, all sharing the checkout id. Safe to repeat after a partial failure. */
  placeCheckout(input: CheckoutInput): Promise<Order[]>
  listMyOrders(): Promise<Order[]>
  listMyNotifications(): Promise<AppNotification[]>
  markNotificationRead(id: string): Promise<void>

  // Admin
  saveClothing(input: ClothingInput): Promise<Clothing>
  /** Stores a photo in the photo library and returns the link to save in PhotoUrl. */
  uploadPhoto(image: Blob, baseName: string): Promise<string>
  listCosts(): Promise<ClothingCost[]>
  setCurrentCost(clothingId: string, unitCost: number): Promise<void>
  listAllOrders(): Promise<Order[]>
  getSalesSummary(): Promise<SalesSummary>
  /** Asks the suppliers for more stock. The Restock Request flow emails every Supplier in Users. */
  requestRestock(clothingId: string, note: string): Promise<RestockRequest>
  /** Newest first. */
  listRestockRequests(): Promise<RestockRequest[]>
  listSuppliers(): Promise<Supplier[]>
  /** Gives an organisation account the Supplier role (adds its Users row if missing). */
  addSupplier(email: string): Promise<Supplier>
  /** Sets the role back to Customer; the Users row is kept. */
  removeSupplier(id: string): Promise<void>
}

export function isTerminal(o: Pick<Order, 'status'>): boolean {
  return o.status !== 'Pending' && o.status !== 'Processing'
}

export function computeSummary(orders: Order[], costs: ClothingCost[]): SalesSummary {
  const confirmed = orders.filter((o) => o.status === 'Confirmed')
  const snapshots = new Map(
    costs.filter((c) => c.costType === 'SaleCost').map((c) => [c.orderId, c]),
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
