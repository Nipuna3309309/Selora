import type { AppNotification, AppUser, Clothing, ClothingCost, Order } from '../domain/types'

export interface EmailLogEntry {
  to: string
  subject: string
  status: 'sent' | 'failed'
  at: string
}

export interface DemoDb {
  users: AppUser[]
  clothes: Clothing[]
  costs: ClothingCost[]
  orders: Order[]
  notifications: AppNotification[]
  emails: EmailLogEntry[]
  seq: number
}

const img = (label: string, bg: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${bg}"/><text x="200" y="160" font-family="sans-serif" font-size="28" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )

export const DEMO_USERS: AppUser[] = [
  { email: 'customer1@demo.selora.test', name: 'Demo Customer One', role: 'Customer' },
  { email: 'customer2@demo.selora.test', name: 'Demo Customer Two', role: 'Customer' },
  { email: 'admin@demo.selora.test', name: 'Demo Admin', role: 'Admin' },
]

export function seedDb(): DemoDb {
  const mk = (
    id: string,
    name: string,
    category: string,
    size: string,
    colour: string,
    price: number,
    stock: number,
    threshold: number,
    bg: string,
    isActive = true,
  ): Clothing => ({
    id,
    name,
    sku: 'SEL-' + id.padStart(3, '0'),
    category,
    size,
    colour,
    photoUrl: img(name, bg),
    price,
    stock,
    lowStockThreshold: threshold,
    isActive,
  })
  const clothes = [
    mk('1', 'Linen Shirt', 'Shirt', 'M', 'White', 6500, 12, 3, '#6b7a8f'),
    mk('2', 'Cotton T-Shirt', 'T-Shirt', 'L', 'Navy', 3200, 25, 5, '#2f4b7c'),
    mk('3', 'Slim Chinos', 'Trousers', 'L', 'Beige', 8900, 4, 3, '#a68a64'),
    mk('4', 'Summer Dress', 'Dress', 'S', 'Coral', 11500, 1, 2, '#d1604d'),
    mk('5', 'Denim Shorts', 'Shorts', 'M', 'Blue', 5900, 0, 2, '#3d6a8f'),
    mk('6', 'Canvas Cap', 'Other', 'One Size', 'Grey', 2800, 8, 2, '#5c6b5c', false),
  ]
  const costRows: [string, number][] = [
    ['1', 3800],
    ['2', 1700],
    ['3', 5200],
    ['4', 6800],
    ['5', 3000],
    ['6', 1400],
  ]
  return {
    users: DEMO_USERS.map((u) => ({ ...u })),
    clothes,
    costs: costRows.map(([cid, cost], i) => ({
      id: String(i + 1),
      recordKey: 'CURRENT-' + cid,
      clothingId: cid,
      costType: 'CurrentCost' as const,
      unitCost: cost,
      orderId: '',
      quantity: 0,
    })),
    orders: [],
    notifications: [],
    emails: [],
    seq: 1000,
  }
}

const KEY = 'selora-demo-db-v2'

export function loadDb(): DemoDb {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoDb
  } catch {
    /* corrupt or unavailable storage: start from seed data */
  }
  return seedDb()
}

export function saveDb(db: DemoDb): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* storage unavailable: demo still works for this session */
  }
}

export function resetDb(): DemoDb {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  return seedDb()
}
