/**
 * ASSUMED SharePoint schema. The brief referred to "exact columns supplied with
 * this prompt" but none were attached, so these names are proposals. If your
 * columns differ, change them here and in provisioning/provision-sharepoint.ps1.
 * Internal column names must not contain spaces.
 */
export const LISTS = {
  users: 'Users',
  clothes: 'Clothes',
  costs: 'ClothingCosts',
  orders: 'Orders',
  notifications: 'Notifications',
} as const

export type ListName = (typeof LISTS)[keyof typeof LISTS]

export const COLS = {
  users: { email: 'Title', displayName: 'DisplayName', role: 'Role' },
  clothes: {
    name: 'Title',
    category: 'Category',
    description: 'Description',
    imageUrl: 'ImageUrl',
    size: 'Size',
    colour: 'Colour',
    price: 'Price',
    stock: 'Stock',
    lowStockThreshold: 'LowStockThreshold',
    isActive: 'IsActive',
    stockAlertState: 'StockAlertState',
  },
  costs: {
    costKey: 'Title',
    clothingId: 'ClothingId',
    costType: 'CostType',
    unitCost: 'UnitCost',
    orderId: 'OrderId',
    quantity: 'Quantity',
  },
  orders: {
    requestId: 'Title',
    clothingId: 'ClothingId',
    quantity: 'Quantity',
    simulatedPayment: 'SimulatedPayment',
    clothingName: 'ClothingName',
    unitPrice: 'UnitPrice',
    total: 'Total',
    stockBefore: 'StockBefore',
    stockAfter: 'StockAfter',
    status: 'OrderStatus',
    processingStatus: 'ProcessingStatus',
    processingStage: 'ProcessingStage',
    resultMessage: 'ResultMessage',
  },
  notifications: {
    notificationKey: 'Title',
    recipientEmail: 'RecipientEmail',
    type: 'NotificationType',
    message: 'Message',
    orderId: 'OrderId',
    isRead: 'IsRead',
  },
} as const
