import { validateClothing } from '../domain/validation'
import { nextSku } from '../domain/sku'
import type {
  AppNotification,
  AppUser,
  Clothing,
  ClothingCost,
  ClothingInput,
  CheckoutInput,
  NewOrderInput,
  Order,
  RestockRequest,
  Role,
  SalesSummary,
  Supplier,
} from '../domain/types'
import { AccessDeniedError, computeSummary, type ShopService } from '../services/ShopService'
import { COLS, LISTS, PHOTO_LIBRARY } from './columns'
import { type SharePointGateway, type SpRow, UniqueViolationError } from './gateway'
import { blobToBase64, contentToBlob, libraryPathOf, photoUrlFor } from './photos'

const str = (v: unknown): string => (v == null ? '' : String(v))
const num = (v: unknown): number => (v == null || v === '' ? 0 : Number(v))
const optNum = (v: unknown): number | null => (v == null || v === '' ? null : Number(v))
/**
 * Lookup columns are written as an object holding the target item's Id. The
 * `<Column>#Id` fields in the generated schema are read-only and SharePoint rejects them.
 */
const lookup = (id: string) => ({
  '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedReference',
  Id: Number(id),
})
const odata = (s: string): string => s.replace(/'/g, "''")
/** Person columns are written with the account's claims; SharePoint resolves the rest. */
const person = (email: string) => ({
  '@odata.type': '#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser',
  Claims: `i:0#.f|membership|${email}`,
})
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Choice columns can arrive as a string or `{ Value }`. */
const choice = (v: unknown): string =>
  v && typeof v === 'object' && 'Value' in v ? str((v as { Value: unknown }).Value) : str(v)
const lookupId = (v: unknown): string =>
  v && typeof v === 'object' && 'Id' in v ? str((v as { Id: unknown }).Id) : ''
const lookupValue = (v: unknown): string =>
  v && typeof v === 'object' && 'Value' in v ? str((v as { Value: unknown }).Value) : ''
const personEmail = (v: unknown): string =>
  v && typeof v === 'object' && 'Email' in v ? str((v as { Email: unknown }).Email).toLowerCase() : ''
const url = (v: unknown): string =>
  v && typeof v === 'object' && 'Url' in v ? str((v as { Url: unknown }).Url) : str(v)

function toClothing(r: SpRow): Clothing {
  const c = COLS.clothes
  return {
    id: str(r.ID),
    name: str(r[c.name]),
    sku: str(r[c.sku]),
    category: choice(r[c.category]),
    size: choice(r[c.size]),
    colour: str(r[c.colour]),
    photoUrl: url(r[c.photoUrl]),
    price: num(r[c.price]),
    stock: num(r[c.stock]),
    lowStockThreshold: num(r[c.lowStockThreshold]),
    isActive: r[c.isActive] === true,
  }
}

function toOrder(r: SpRow): Order {
  const c = COLS.orders
  return {
    id: str(r.ID),
    requestId: str(r[c.requestId]),
    clothingId: lookupId(r[c.clothing]),
    clothingName: lookupValue(r[c.clothing]),
    quantity: num(r[c.quantity]),
    simulatedPayment: choice(r[c.simulatedPayment]) as Order['simulatedPayment'],
    unitPrice: num(r[c.unitPrice]),
    total: num(r[c.total]),
    stockBefore: optNum(r[c.stockBefore]),
    stockAfter: optNum(r[c.stockAfter]),
    status: (choice(r[c.status]) || 'Pending') as Order['status'],
    processingStage: (choice(r[c.processingStage]) || 'New') as Order['processingStage'],
    resultMessage: str(r[c.resultMessage]),
    createdByEmail: str(r.CreatedByEmail).toLowerCase(),
    createdAt: str(r.Created),
  }
}

function toCost(r: SpRow): ClothingCost {
  const c = COLS.costs
  return {
    id: str(r.ID),
    recordKey: str(r[c.recordKey]),
    clothingId: lookupId(r[c.clothing]),
    costType: choice(r[c.recordType]) as ClothingCost['costType'],
    unitCost: num(r[c.unitCost]),
    orderId: str(r[c.orderItemId]),
    quantity: num(r[c.quantity]),
  }
}

function toNotification(r: SpRow): AppNotification {
  const c = COLS.notifications
  const email = choice(r[c.emailStatus])
  return {
    id: str(r.ID),
    notificationKey: str(r[c.notificationKey]),
    recipientEmail: personEmail(r[c.recipient]),
    type: choice(r[c.type]) as AppNotification['type'],
    message: str(r[c.message]),
    orderId: str(r[c.orderItemId]),
    isRead: r[c.isRead] === true,
    emailStatus: email ? (email as AppNotification['emailStatus']) : undefined,
    createdAt: str(r.Created),
  }
}

function toSupplier(r: SpRow): Supplier {
  const account = r[COLS.users.userAccount] as { DisplayName?: unknown } | undefined
  const email = personEmail(account)
  return { id: str(r.ID), email, name: str(account?.DisplayName) || email }
}

function toRestock(r: SpRow): RestockRequest {
  const c = COLS.notifications
  return {
    id: str(r.ID),
    clothingId: str(r[c.orderItemId]),
    note: str(r[c.message]),
    emailStatus: (choice(r[c.emailStatus]) || 'Pending') as RestockRequest['emailStatus'],
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
        filter: `${COLS.users.userAccount}/EMail eq '${odata(email)}'`,
        top: 1,
      })
      if (rows[0] && choice(rows[0][COLS.users.role]) === 'Admin') role = 'Admin'
    } catch {
      // Customers have no read access to Users; that correctly means Customer.
    }
    return new LiveShopService(gw, { email, name: displayName || email, role })
  }

  currentUser(): AppUser {
    return this.user
  }

  private requireAdmin(): void {
    if (this.user.role !== 'Admin') throw new AccessDeniedError()
  }

  /** Object URLs for library photos, kept for the session so the grid doesn't download a photo twice. */
  private photos = new Map<string, Promise<string>>()

  photoSrc(photoUrl: string): Promise<string> {
    const path = libraryPathOf(photoUrl)
    if (!path) return Promise.resolve(photoUrl)
    let src = this.photos.get(photoUrl)
    if (!src) {
      src = this.gw.readFile(path).then((data) => URL.createObjectURL(contentToBlob(data)))
      src.catch(() => this.photos.delete(photoUrl))
      this.photos.set(photoUrl, src)
    }
    return src
  }

  async uploadPhoto(image: Blob, baseName: string): Promise<string> {
    this.requireAdmin()
    const safe = baseName.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'clothing'
    // A timestamp keeps names unique, so a new photo never overwrites one an old order still shows.
    const name = `${safe}-${Date.now()}.jpg`
    const path = await this.gw.uploadFile(PHOTO_LIBRARY, name, await blobToBase64(image))
    return photoUrlFor(path)
  }

  async listClothes(): Promise<Clothing[]> {
    return (await this.gw.getItems(LISTS.clothes, { orderBy: `${COLS.clothes.name} asc` })).map(toClothing)
  }

  async placeOrder(input: NewOrderInput): Promise<Order> {
    const c = COLS.orders
    try {
      const row = await this.gw.createItem(LISTS.orders, {
        Title: input.requestId, // built-in Title is required by default
        [c.requestId]: input.requestId,
        [c.clothing]: lookup(input.clothingId),
        [c.quantity]: input.quantity,
        [c.simulatedPayment]: input.simulatedPayment,
        // Only these four request fields are sent. Price, total, status and stage are the flow's job
        // (Status/ProcessingStage rely on their SharePoint defaults: Pending / New).
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

  async placeCheckout(input: CheckoutInput): Promise<Order[]> {
    if (input.lines.length === 0) throw new Error('The cart is empty.')
    const placed: Order[] = []
    // One at a time and in order: the flow handles orders one by one, so the lines are processed in cart order.
    for (const [i, line] of input.lines.entries()) {
      placed.push(
        await this.placeOrder({
          requestId: `${input.checkoutId}:${i + 1}`,
          clothingId: line.clothingId,
          quantity: line.quantity,
          simulatedPayment: input.payment,
        }),
      )
    }
    return placed
  }

  async listMyOrders(): Promise<Order[]> {
    const rows = await this.gw.getItems(LISTS.orders, { orderBy: 'Created desc' })
    // SharePoint already limits rows to the user's own; this is a second check.
    return rows.map(toOrder).filter((o) => o.createdByEmail === this.user.email)
  }

  async listMyNotifications(): Promise<AppNotification[]> {
    const rows = await this.gw.getItems(LISTS.notifications, {
      filter: `${COLS.notifications.recipient}/EMail eq '${odata(this.user.email)}'`,
      orderBy: 'Created desc',
    })
    return rows.map(toNotification).filter((n) => n.recipientEmail === this.user.email)
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.gw.updateItem(LISTS.notifications, id, { [COLS.notifications.isRead]: true })
  }

  async saveClothing(input: ClothingInput): Promise<Clothing> {
    this.requireAdmin()
    if (!input.name.trim()) throw new Error('Name is required.')
    // Same checks as the form, in case anything else calls this. SKU uniqueness is SharePoint's job.
    const problem = Object.values(validateClothing(input))[0]
    if (problem) throw new Error(problem)
    // New items with no SKU get the next number for their type (e.g. TSH-004).
    const autoSku = !input.id && !input.sku.trim()
    const c = COLS.clothes
    const fields = {
      [c.name]: input.name,
      [c.sku]: input.sku,
      [c.category]: input.category,
      [c.size]: input.size,
      [c.colour]: input.colour,
      [c.photoUrl]: input.photoUrl,
      [c.price]: input.price,
      [c.stock]: input.stock,
      [c.lowStockThreshold]: input.lowStockThreshold,
      [c.isActive]: input.isActive,
    }
    if (input.id) return toClothing(await this.gw.updateItem(LISTS.clothes, input.id, fields))
    if (!autoSku) return toClothing(await this.gw.createItem(LISTS.clothes, fields))

    const taken = (await this.listClothes()).map((x) => x.sku)
    // SKU is unique in SharePoint, so if another admin took the number at the same moment, try the next one.
    for (let skip = 0; ; skip++) {
      const sku = nextSku(input.category, taken, skip)
      try {
        return toClothing(await this.gw.createItem(LISTS.clothes, { ...fields, [c.sku]: sku }))
      } catch (e) {
        if (!(e instanceof UniqueViolationError) || skip >= 4) throw e
      }
    }
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
    const rows = await this.gw.getItems(LISTS.costs, { filter: `${c.recordKey} eq '${odata(key)}'`, top: 1 })
    // Only the CURRENT-<id> row changes; SALE-<orderId> rows are never edited.
    if (rows[0]) await this.gw.updateItem(LISTS.costs, str(rows[0].ID), { [c.unitCost]: unitCost })
    else
      await this.gw.createItem(LISTS.costs, {
        Title: key,
        [c.recordKey]: key,
        [c.recordType]: 'CurrentCost',
        [c.clothing]: lookup(clothingId),
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

  async requestRestock(clothingId: string, note: string): Promise<RestockRequest> {
    this.requireAdmin()
    const c = COLS.notifications
    const key = `RESTOCK-${clothingId}-${Date.now()}`
    const item = (await this.listClothes()).find((x) => x.id === clothingId)
    // OrderItemId carries the clothing ID: the flow looks the item up in Clothes and emails the suppliers.
    const row = await this.gw.createItem(LISTS.notifications, {
      Title: `Restock request: ${item?.name ?? clothingId}`,
      [c.notificationKey]: key,
      [c.type]: 'RestockRequest',
      [c.orderItemId]: Number(clothingId),
      [c.message]: note,
      [c.emailStatus]: 'Pending',
    })
    return toRestock(row)
  }

  async listRestockRequests(): Promise<RestockRequest[]> {
    this.requireAdmin()
    const rows = await this.gw.getItems(LISTS.notifications, {
      filter: `${COLS.notifications.type} eq 'RestockRequest'`,
      orderBy: 'Created desc',
    })
    return rows.map(toRestock)
  }

  async listSuppliers(): Promise<Supplier[]> {
    this.requireAdmin()
    const rows = await this.gw.getItems(LISTS.users, { filter: `${COLS.users.role} eq 'Supplier'` })
    return rows.map(toSupplier).sort((a, b) => a.name.localeCompare(b.name))
  }

  async addSupplier(email: string): Promise<Supplier> {
    this.requireAdmin()
    const e = email.trim().toLowerCase()
    if (!EMAIL.test(e)) throw new Error('Enter an email address, like name@company.com.')
    const u = COLS.users
    const rows = await this.gw.getItems(LISTS.users, { filter: `${u.userAccount}/EMail eq '${odata(e)}'`, top: 1 })
    if (rows[0] && choice(rows[0][u.role]) === 'Admin') throw new Error(`${e} is an admin. Admins can't also be suppliers.`)
    const row = rows[0]
      ? await this.gw.updateItem(LISTS.users, str(rows[0].ID), { [u.role]: 'Supplier' })
      : await this.gw.createItem(LISTS.users, { Title: e, [u.userAccount]: person(e), [u.role]: 'Supplier' })
    return toSupplier(row)
  }

  async removeSupplier(id: string): Promise<void> {
    this.requireAdmin()
    await this.gw.updateItem(LISTS.users, id, { [COLS.users.role]: 'Customer' })
  }
}
