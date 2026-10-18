/**
 * SharePoint list and column names, as created on the NipunaAutomateTesting site.
 * ID, Title, Created and Created By are built in. Keep this file as the only place
 * these names appear in the app. They match the generated models in src/generated.
 */
export const SITE_URL = 'https://netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting'

/** Document library for clothing photos, found by its display name so its web address doesn't matter. */
export const PHOTO_LIBRARY = 'Clothing Photos'

export const LISTS = {
  users: 'Users',
  clothes: 'Clothes',
  costs: 'ClothingCosts',
  orders: 'Orders',
  notifications: 'Notifications',
} as const

export type ListName = (typeof LISTS)[keyof typeof LISTS]

export const COLS = {
  users: { userAccount: 'UserAccount', role: 'Role' },
  clothes: {
    name: 'Title',
    sku: 'SKU',
    category: 'Category',
    size: 'Size',
    colour: 'Colour',
    photoUrl: 'PhotoUrl',
    price: 'SellingPrice',
    stock: 'StockQuantity',
    lowStockThreshold: 'LowStockLevel',
    isActive: 'IsActive',
    autoPrice: 'AutoPrice',
  },
  costs: {
    recordKey: 'RecordKey',
    recordType: 'RecordType',
    clothing: 'Clothing',
    orderItemId: 'OrderItemId',
    unitCost: 'UnitCost',
    quantity: 'Quantity',
  },
  orders: {
    requestId: 'RequestId',
    clothing: 'Clothing',
    quantity: 'Quantity',
    simulatedPayment: 'SimulatedPayment',
    status: 'Status',
    unitPrice: 'UnitPrice',
    total: 'TotalAmount',
    stockBefore: 'StockBefore',
    stockAfter: 'StockAfter',
    processingStage: 'ProcessingStage',
    resultMessage: 'ResultMessage',
  },
  notifications: {
    notificationKey: 'NotificationKey',
    recipient: 'Recipient',
    message: 'Message',
    type: 'NotificationType',
    orderItemId: 'OrderItemId',
    isRead: 'IsRead',
    emailStatus: 'EmailStatus',
  },
} as const
