import { stateAfterAdminEdit, validateClothingNumbers } from '../domain/alerts'
import type {
  AppNotification,
  AppUser,
  Clothing,
  ClothingCost,
  ClothingInput,
  NewOrderInput,
  Order,
  Role,
  SalesSummary,
} from '../domain/types'
import { AccessDeniedError, computeSummary, type ShopService } from '../services/ShopService'
import { COLS, LISTS } from './columns'
import { type SharePointGateway, type SpRow, UniqueViolationError } from './gateway'

const str = (v: unknown): string => (v == null ? '' : String(v))
const num = (v: unknown): number => (v == null || v === '' ? 0 : Number(v))
const optNum = (v: unknown): number | null => (v == null || v === '' ? null : Number(v))
const odata = (s: string): string => s.replace(/'/g, "''")

function toClothing(r: SpRow): Clothing {
  const c = COLS.clothes
  return {
    id: str(r.ID),
    name: str(r[c.name]),
    category: str(r[c.category]),
    description: str(r[c.description]),
    imageUrl: str(r[c.imageUrl]),
    size: str(r[c.size]),
    colour: str(r[c.colour]),
    price: num(r[c.price]),
    stock: num(r[c.stock]),
    lowStockThreshold: num(r[c.lowStockThreshold]),
    isActive: r[c.isActive] === true,
    stockAlertState: (str(r[c.stockAlertState]) || 'None') as Clothing['stockAlertState'],
  }
}

function toOrder(r: SpRow): Order {
  const c = COLS.orders
  return {
    id: str(r.ID),
    requestId: str(r[c.requestId]),
    clothingId: str(r[c.clothingId]),
    quantity: num(r[c.quantity]),
    simulatedPayment: str(r[c.simulatedPayment]) as Order['simulatedPayment'],
    clothingName: str(r[c.clothingName]),
    unitPrice: num(r[c.unitPrice]),
    total: num(r[c.total]),
    stockBefore: optNum(r[c.stockBefore]),
    stockAfter: optNum(r[c.stockAfter]),
    status: (str(r[c.status]) || 'Submitted') as Order['status'],
    processingStatus: (str(r[c.processingStatus]) || 'Pending') as Order['processingStatus'],
    processingStage: (str(r[c.processingStage]) || 'Received') as Order['processingStage'],
    resultMessage: str(r[c.resultMessage]),
    createdByEmail: str(r.CreatedByEmail),
    createdAt: str(r.Created),
  }
}

function toCost(r: SpRow): ClothingCost {
  const c = COLS.costs
  return {
    id: str(r.ID),
    costKey: str(r[c.costKey]),
    clothingId: str(r[c.clothingId]),
    costType: str(r[c.costType]) as ClothingCost['costType'],
    unitCost: num(r[c.unitCost]),
    orderId: str(r[c.orderId]),
    quantity: num(r[c.quantity]),
  }
}

function toNotification(r: SpRow): AppNotification {
  const c = COLS.notifications
  return {
    id: str(r.ID),
    notificationKey: str(r[c.notificationKey]),
    recipientEmail: str(r[c.recipientEmail]),
    type: str(r[c.type]) as AppNotification['type'],
    message: str(r[c.message]),
    orderId: str(r[c.orderId]),
    isRead: r[c.isRead] === true,
    createdAt: str(r.Created),
  }
}

/**
 * SharePoint-backed service. Client-side role checks are only for friendlier UI;
 * SharePoint list permissions are what actually enforce access.
 */
export class LiveShopService implements ShopService {
  private gw: SharePointGateway
  private user: AppUser

  private constructor(gw: SharePointGateway, user: AppUser) {
    this.gw = gw
    this.user = user
  }

  /** Resolves the signed-in user and their role. Missing role means Customer. */
  static async create(gw: SharePointGateway, displayName: string): Promise<LiveShopService> {
    const email = (await gw.currentUserEmail()).toLowerCase()
    let role: Role = 'Customer'
    try {
      const rows = await gw.getItems(LISTS.users, {
        filter: `${COLS.users.email} eq '${odata(email)}'`,
        top: 1,
      })
      if (rows[0] && str(rows[0][COLS.users.role]) === 'Admin') role = 'Admin'
    } catch {
      // Customers may have no read access to Users; that correctly means Customer.
    }
    return new LiveShopService(gw, { email, name: displayName || email, role })
  }

  currentUser(): AppUser {
    return this.user
  }

  private requireAdmin(): void {
    if (this.user.role !== 'Admin') throw new AccessDeniedError()
  }

  async listClothes(): Promise<Clothing[]> {
    return (await this.gw.getItems(LISTS.clothes, { orderBy: `${COLS.clothes.name} asc` })).map(toClothing)
  }

  async placeOrder(input: NewOrderInput): Promise<Order> {
    const c = COLS.orders
    try {
      const row = await this.gw.createItem(LISTS.orders, {
        [c.requestId]: input.requestId,
        [c.clothingId]: input.clothingId,
        [c.quantity]: input.quantity,
        [c.simulatedPayment]: input.simulatedPayment,
        // Only the four request fields are sent. Price, total and status are the flow's job.
      })
      return toOrder(row)
    } catch (e) {
      if (!(e instanceof UniqueViolationError)) throw e
      const rows = await this.gw.getItems(LISTS.orders, {
        filter: `${c.requestId} eq '${odata(input.requestId)}'`,
        top: 1,
      })
      if (!rows[0]) throw e
      return toOrder(rows[0])
    }
  }

  async listMyOrders(): Promise<Order[]> {
    const rows = await this.gw.getItems(LISTS.orders, { orderBy: 'Created desc' })
    // SharePoint already limits rows to the user's own; this is a second check.
    return rows.map(toOrder).filter((o) => o.createdByEmail.toLowerCase() === this.user.email)
  }

  async listMyNotifications(): Promise<AppNotification[]> {
    const rows = await this.gw.getItems(LISTS.notifications, {
      filter: `${COLS.notifications.recipientEmail} eq '${odata(this.user.email)}'`,
      orderBy: 'Created desc',
    })
    return rows.map(toNotification)
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.gw.updateItem(LISTS.notifications, id, { [COLS.notifications.isRead]: true })
  }

  async saveClothing(input: ClothingInput): Promise<Clothing> {
    this.requireAdmin()
    if (!input.name.trim()) throw new Error('Name is required.')
    validateClothingNumbers(input.price, input.stock, input.lowStockThreshold)
    const c = COLS.clothes
    const prevRows = input.id
      ? await this.gw.getItems(LISTS.clothes, { filter: `ID eq ${Number(input.id)}`, top: 1 })
      : []
    const prev = prevRows[0] ? toClothing(prevRows[0]).stockAlertState : 'None'
    const fields = {
      [c.name]: input.name,
      [c.category]: input.category,
      [c.description]: input.description,
      [c.imageUrl]: input.imageUrl,
      [c.size]: input.size,
      [c.colour]: input.colour,
      [c.price]: input.price,
      [c.stock]: input.stock,
      [c.lowStockThreshold]: input.lowStockThreshold,
      [c.isActive]: input.isActive,
      [c.stockAlertState]: stateAfterAdminEdit(prev, input.stock, input.lowStockThreshold),
    }
    const row = input.id
      ? await this.gw.updateItem(LISTS.clothes, input.id, fields)
      : await this.gw.createItem(LISTS.clothes, fields)
    return toClothing(row)
  }

  async listCosts(): Promise<ClothingCost[]> {
    this.requireAdmin()
    return (await this.gw.getItems(LISTS.costs)).map(toCost)
  }

  async setCurrentCost(clothingId: string, unitCost: number): Promise<void> {
    this.requireAdmin()
    if (!(unitCost >= 0)) throw new Error('Cost must be zero or more.')
    const c = COLS.costs
    const key = `CURRENT-${clothingId}`
    const rows = await this.gw.getItems(LISTS.costs, { filter: `${c.costKey} eq '${odata(key)}'`, top: 1 })
    if (rows[0]) await this.gw.updateItem(LISTS.costs, str(rows[0].ID), { [c.unitCost]: unitCost })
    else
      await this.gw.createItem(LISTS.costs, {
        [c.costKey]: key,
        [c.clothingId]: clothingId,
        [c.costType]: 'Current',
        [c.unitCost]: unitCost,
      })
  }

  async listAllOrders(): Promise<Order[]> {
    this.requireAdmin()
    return (await this.gw.getItems(LISTS.orders, { orderBy: 'Created desc' })).map(toOrder)
  }

  async getSalesSummary(): Promise<SalesSummary> {
    this.requireAdmin()
    const [orders, costs] = await Promise.all([this.listAllOrders(), this.listCosts()])
    return computeSummary(orders, costs)
  }
}
