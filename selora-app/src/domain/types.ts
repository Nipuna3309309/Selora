export type Role = 'Customer' | 'Admin'

export interface AppUser {
  email: string
  name: string
  role: Role
}

export type StockAlertState = 'None' | 'Low' | 'Zero'

export interface Clothing {
  id: string
  name: string
  category: string
  description: string
  imageUrl: string
  size: string
  colour: string
  price: number
  stock: number
  lowStockThreshold: number
  isActive: boolean
  /** Written by the flow so low/zero alerts fire once per crossing. */
  stockAlertState: StockAlertState
}

export type CostType = 'Current' | 'SaleSnapshot'

export interface ClothingCost {
  id: string
  /** Unique key: CURRENT-<clothingId> or SALE-<orderId>. */
  costKey: string
  clothingId: string
  costType: CostType
  unitCost: number
  orderId: string
  quantity: number
}

export type SimulatedPayment = 'Success' | 'Failure'
export type OrderStatus = 'Submitted' | 'Confirmed' | 'Rejected'
export type ProcessingStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'NeedsReview'
export type ProcessingStage =
  | 'Received'
  | 'Prepared'
  | 'StockUpdated'
  | 'SnapshotCreated'
  | 'Confirmed'

export interface Order {
  id: string
  /** Stable client-generated key (the Title column); unique so retries cannot duplicate. */
  requestId: string
  clothingId: string
  quantity: number
  simulatedPayment: SimulatedPayment
  // Everything below is written only by the flow.
  clothingName: string
  unitPrice: number
  total: number
  stockBefore: number | null
  stockAfter: number | null
  status: OrderStatus
  processingStatus: ProcessingStatus
  processingStage: ProcessingStage
  resultMessage: string
  /** SharePoint Created By. */
  createdByEmail: string
  createdAt: string
}

export type NotificationType = 'OrderConfirmed' | 'OrderRejected' | 'LowStock' | 'OutOfStock' | 'NeedsReview'

export interface AppNotification {
  id: string
  /** Unique key preventing duplicates, e.g. ORDER-<id>-CONFIRMED. */
  notificationKey: string
  recipientEmail: string
  type: NotificationType
  message: string
  orderId: string
  isRead: boolean
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
  category: string
  description: string
  imageUrl: string
  size: string
  colour: string
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
