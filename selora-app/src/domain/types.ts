/** Users.Role also has Supplier (restock emails only); the app treats anyone not Admin as a Customer. */
export type Role = 'Customer' | 'Admin'

export interface AppUser {
  email: string
  name: string
  role: Role
}

export const CATEGORIES = ['T-Shirt', 'Shirt', 'Trousers', 'Dress', 'Shorts', 'Other'] as const
/** Colour palette offered when adding clothing; the name is what gets stored. */
export const COLOURS = [
  { name: 'Black', hex: '#1c1c1e' },
  { name: 'White', hex: '#f7f5f0' },
  { name: 'Grey', hex: '#8e8e93' },
  { name: 'Navy', hex: '#1f2f56' },
  { name: 'Blue', hex: '#2f6fd0' },
  { name: 'Sky Blue', hex: '#8cc4ec' },
  { name: 'Green', hex: '#2f8a4f' },
  { name: 'Olive', hex: '#6b7a3a' },
  { name: 'Yellow', hex: '#f2c230' },
  { name: 'Orange', hex: '#ec8a2c' },
  { name: 'Red', hex: '#c8362f' },
  { name: 'Maroon', hex: '#7a1f2e' },
  { name: 'Pink', hex: '#ec8fb0' },
  { name: 'Purple', hex: '#7a4bb5' },
  { name: 'Brown', hex: '#7a5230' },
  { name: 'Beige', hex: '#d8c4a0' },
] as const

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] as const

export interface Clothing {
  id: string
  name: string
  sku: string
  category: string
  size: string
  colour: string
  photoUrl: string
  price: number
  stock: number
  lowStockThreshold: number
  isActive: boolean
}

/** RecordKey is CURRENT-<clothingId> or SALE-<orderId>. */
export type CostType = 'CurrentCost' | 'SaleCost'

export interface ClothingCost {
  id: string
  recordKey: string
  clothingId: string
  costType: CostType
  unitCost: number
  /** Order ID for SaleCost rows. */
  orderId: string
  quantity: number
}

/** 'Success' is Pay now. 'Cash on delivery' must exist as a choice on Orders.SimulatedPayment. 'Failed' only appears on old rows. */
export type SimulatedPayment = 'Success' | 'Failed' | 'Cash on delivery'
export type OrderStatus = 'Pending' | 'Processing' | 'Confirmed' | 'Rejected' | 'NeedsReview'
export type ProcessingStage = 'New' | 'Prepared' | 'StockUpdated' | 'Completed'

export interface Order {
  id: string
  /** Stable client-generated key; unique so retries cannot duplicate. */
  requestId: string
  clothingId: string
  /** Lookup display value (Clothes Title). */
  clothingName: string
  quantity: number
  simulatedPayment: SimulatedPayment
  // Everything below is written only by the flow.
  unitPrice: number
  total: number
  stockBefore: number | null
  stockAfter: number | null
  status: OrderStatus
  processingStage: ProcessingStage
  resultMessage: string
  /** SharePoint Created By. */
  createdByEmail: string
  createdAt: string
}

export type NotificationType =
  | 'OrderConfirmed'
  | 'OrderRejected'
  | 'LowStock'
  | 'OutOfStock'
  /** Not in the lists as created: add this choice to Notifications.NotificationType. */
  | 'NeedsReview'
  /** An admin asked for more stock; the Restock Request flow emails every Supplier in Users. Add this choice too. */
  | 'RestockRequest'

export type EmailStatus = 'Pending' | 'Sent' | 'Failed'

export interface AppNotification {
  id: string
  /** Unique key preventing duplicates, e.g. ORDER-<id>-CONFIRMED. */
  notificationKey: string
  recipientEmail: string
  type: NotificationType
  message: string
  orderId: string
  isRead: boolean
  emailStatus?: EmailStatus
  createdAt: string
}

/** A Users row with Role = Supplier. Suppliers get the restock emails. */
export interface Supplier {
  id: string
  email: string
  name: string
}

/** A Notifications row of type RestockRequest. */
export interface RestockRequest {
  id: string
  clothingId: string
  note: string
  /** Pending until the flow has emailed the sales person. */
  emailStatus: EmailStatus
  createdAt: string
}

export interface NewOrderInput {
  requestId: string
  clothingId: string
  quantity: number
  simulatedPayment: SimulatedPayment
}

export interface CheckoutInput {
  /** One per checkout attempt, so a retry or double click cannot place the order twice. */
  checkoutId: string
  lines: { clothingId: string; quantity: number }[]
  payment: Exclude<SimulatedPayment, 'Failed'>
}

export interface ClothingInput {
  id?: string
  name: string
  sku: string
  category: string
  size: string
  colour: string
  photoUrl: string
  price: number
  stock: number
  lowStockThreshold: number
  isActive: boolean
}

export interface SalesSummary {
  confirmedRevenue: number
  unitsSold: number
  costOfGoodsSold: number
  grossProfit: number
  confirmedOrders: number
}
