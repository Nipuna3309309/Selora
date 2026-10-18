import type {
  AppNotification,
  AppUser,
  CheckoutInput,
  Clothing,
  ClothingCost,
  ClothingInput,
  NewOrderInput,
  Order,
  PurchaseInput,
  RestockRequest,
  Supplier,
} from '../domain/types'
import type { ProfitRule } from '../domain/pricing'
import type { Counter, OfferInput, OfferStatus, SupplierOffer, SupplierRequest } from '../domain/supplier'

export interface SupplierView {
  requests: SupplierRequest[]
  offers: (SupplierOffer & { status: OfferStatus })[]
}

export class AccessDeniedError extends Error {
  constructor(message = 'You do not have access to this data.') {
    super(message)
    this.name = 'AccessDeniedError'
  }
}

/** addStock got the stock in but a later step failed. Don't retry addStock: that would add the stock twice. */
export class StockSavedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StockSavedError'
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
  /** Every ClothingCosts row: current costs, sale costs, purchases and profit rules. */
  listCosts(): Promise<ClothingCost[]>
  setCurrentCost(clothingId: string, unitCost: number): Promise<void>
  /** Creates or replaces the profit rule for one clothing type. */
  saveProfitRule(rule: ProfitRule): Promise<void>
  /**
   * Adds bought pieces to the stock read fresh from SharePoint (so orders sold meanwhile aren't
   * undone). The current cost becomes the average over old and new pieces, and an Auto item's
   * price follows its profit rule at that cost. Not idempotent: call it once per purchase.
   * Throws StockSavedError if the stock went in but the cost didn't.
   */
  addStock(clothingId: string, quantity: number, unitCost: number): Promise<Clothing>
  /** Sets selling prices, e.g. Auto items brought in line with a changed profit rule. */
  updatePrices(changes: { clothingId: string; price: number }[]): Promise<void>
  /** Logs a purchase for the dashboard. Idempotent on purchaseId. */
  recordPurchase(input: PurchaseInput): Promise<void>
  listAllOrders(): Promise<Order[]>
  /** Asks the suppliers for more stock. The Restock Request flow emails every Supplier in Users. */
  requestRestock(clothingId: string, note: string): Promise<RestockRequest>
  /** Newest first. */
  listRestockRequests(): Promise<RestockRequest[]>
  /** Marks restock requests as done: the delivery arrived, or isn't coming. */
  closeRestockRequests(ids: string[]): Promise<void>
  /**
   * Starts the flows again for orders, and for admins restock emails, still waiting because a flow
   * call was missed (app closed, network, flow busy). Both flows skip rows already handled, so it's safe.
   */
  retryStuck(): Promise<void>

  // Supplier
  /** Open restock requests and the supplier's own offers, through the Supplier Requests flow. */
  supplierView(): Promise<SupplierView>
  /** Sends or replaces the supplier's offer for one request, through the Supplier Offer flow. */
  sendOffer(input: OfferInput): Promise<void>
  /**
   * Admin: answers a supplier's offer with a counter-offer instead of changing it. The supplier sees
   * it and sends a changed offer, which replaces the old one and clears the counter.
   */
  counterOffer(offerId: string, counter: Counter): Promise<void>
  listSuppliers(): Promise<Supplier[]>
  /** Gives an organisation account the Supplier role (adds its Users row if missing). */
  addSupplier(email: string): Promise<Supplier>
  /** Sets the role back to Customer; the Users row is kept. */
  removeSupplier(id: string): Promise<void>
}

export function isTerminal(o: Pick<Order, 'status'>): boolean {
  return o.status !== 'Pending' && o.status !== 'Processing'
}
