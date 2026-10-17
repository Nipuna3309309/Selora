export type Role = 'Customer' | 'Admin'

export interface AppUser {
  email: string
  name: string
  role: Role
}

export const CATEGORIES = ['T-Shirt', 'Shirt', 'Trousers', 'Dress', 'Shorts', 'Other'] as const
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

export type SimulatedPayment = 'Success' | 'Failed'
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

export interface NewOrderInput {
  requestId: string
  clothingId: string
  quantity: number
  simulatedPayment: SimulatedPayment
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
