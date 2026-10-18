import { getContext } from '@microsoft/power-apps/app'
import * as gen from '../generated'
import { SITE_URL, type ListName } from './columns'

/**
 * A SharePoint row as the gateway returns it. Shapes come from the generated models:
 *  - Choice columns arrive as `{ Value }`, lookups as `{ Id, Value }`, Person columns as `{ Email }`.
 *  - Created By is normalised to `CreatedByEmail`.
 * Writes use plain values: choices as strings, lookups as `{ Id }` objects (the `<Column>#Id` fields are read-only).
 */
export type SpRow = Record<string, unknown> & {
  ID: number | string
  Created?: string
  CreatedByEmail?: string
}

export class UniqueViolationError extends Error {
  constructor(message = 'An item with this unique key already exists.') {
    super(message)
    this.name = 'UniqueViolationError'
  }
}

export interface GetItemsOptions {
  /** OData filter, e.g. "RecordKey eq 'CURRENT-3'". */
  filter?: string
  orderBy?: string
  top?: number
}

/** The only place that talks to SharePoint, on top of the generated Code Apps services. */
export interface SharePointGateway {
  currentUserEmail(): Promise<string>
  getItems(list: ListName, options?: GetItemsOptions): Promise<SpRow[]>
  createItem(list: ListName, fields: Record<string, unknown>): Promise<SpRow>
  updateItem(list: ListName, id: string, fields: Record<string, unknown>): Promise<SpRow>
  /** Uploads to a document library (by display name) and returns the file's site-relative path. */
  uploadFile(library: string, name: string, base64: string): Promise<string>
  /** File content by site-relative path, in whatever form the host returns it. */
  readFile(path: string): Promise<unknown>
  /** Starts the Process Order flow for one Orders row. Resolves once the run starts, not when it ends. */
  runProcessOrder(orderId: string): Promise<void>
  /** Starts the Restock Request flow for one RestockRequest row in Notifications. */
  runRestockRequest(notificationId: string): Promise<void>
  /** Runs the Supplier Requests flow: open requests and the caller's offers, as JSON text. */
  runSupplierRequests(): Promise<SupplierFlowResult & { requests?: string; offers?: string; accepted?: string }>
  /** Runs the Supplier Offer flow, which saves the caller's offer. */
  runSupplierOffer(input: { requestId: number; quantity: number; unitCost: number; arriveBy: string; note: string }): Promise<SupplierFlowResult>
}

/** What the supplier flows answer: ok is "true" or "false", with a reason when false. */
export interface SupplierFlowResult {
  ok?: string
  error?: string
}

interface OperationResult<T> {
  success: boolean
  data: T
  error?: unknown
  skipToken?: string
}

interface ListService {
  getAll(options?: Record<string, unknown>): Promise<OperationResult<Record<string, unknown>[]>>
  create(record: Record<string, unknown>): Promise<OperationResult<Record<string, unknown>>>
  update(id: string, fields: Record<string, unknown>): Promise<OperationResult<Record<string, unknown>>>
}

function errorText(e: unknown): string {
  if (e instanceof Error) return e.message
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

function normalise(raw: Record<string, unknown>): SpRow {
  const author = raw.Author as { Email?: string } | undefined
  return { ...raw, ID: raw.ID as number | string, CreatedByEmail: author?.Email?.toLowerCase() }
}

function unwrap<T>(r: OperationResult<T>, what: string): T {
  if (!r.success) {
    const text = errorText(r.error)
    if (/unique|duplicate|already exists|conflict/i.test(text)) throw new UniqueViolationError(text)
    throw new Error(`${what} failed: ${text}`)
  }
  return r.data
}

/** Builds the gateway on the generated services. Failures are thrown, never swallowed. */
export function createGateway(): SharePointGateway {
  const services: Record<ListName, ListService> = {
    Users: gen.Users_1Service as unknown as ListService,
    Clothes: gen.Clothes_1Service as unknown as ListService,
    ClothingCosts: gen.ClothingCosts_1Service as unknown as ListService,
    Orders: gen.Orders_1Service as unknown as ListService,
    Notifications: gen.Notifications_1Service as unknown as ListService,
  }
  const libraries = new Map<string, Promise<string>>()

  /** A library's root folder path, looked up once by display name. */
  function libraryPath(name: string): Promise<string> {
    let found = libraries.get(name)
    if (!found) {
      found = gen.SharePointService.ListRootFolder(SITE_URL).then((r) => {
        const folder = unwrap(r, 'Finding document libraries').find(
          (f) => f.IsFolder !== false && (f.DisplayName === name || f.Name === name),
        )
        if (!folder?.Path) throw new Error(`The "${name}" document library was not found on the SharePoint site.`)
        return folder.Path
      })
      found.catch(() => libraries.delete(name))
      libraries.set(name, found)
    }
    return found
  }

  return {
    async currentUserEmail() {
      const ctx = await getContext()
      const upn = ctx.user.userPrincipalName
      if (!upn) throw new Error('The Power Apps host did not provide the signed-in user.')
      return upn
    },

    async getItems(list, options = {}) {
      const rows: SpRow[] = []
      let skipToken: string | undefined
      do {
        const res = await services[list].getAll({
          filter: options.filter,
          orderBy: options.orderBy ? [options.orderBy] : undefined,
          top: options.top,
          skipToken,
        })
        rows.push(...unwrap(res, `Reading ${list}`).map(normalise))
        skipToken = options.top ? undefined : res.skipToken
      } while (skipToken)
      return rows
    },

    async createItem(list, fields) {
      return normalise(unwrap(await services[list].create(fields), `Creating in ${list}`))
    },

    async updateItem(list, id, fields) {
      return normalise(unwrap(await services[list].update(id, fields), `Updating ${list}`))
    },

    async uploadFile(library, name, base64) {
      const folder = await libraryPath(library)
      // The SDK turns the base64 body into raw bytes because the connector marks it as binary.
      const meta = unwrap(await gen.SharePointService.CreateFile(SITE_URL, folder, name, base64, true), 'Uploading the photo')
      if (!meta.Path) throw new Error('SharePoint did not return the uploaded file path.')
      return meta.Path
    },

    async readFile(path) {
      return unwrap(await gen.SharePointService.GetFileContentByPath(SITE_URL, path, true, true), 'Loading the photo')
    },

    async runProcessOrder(orderId) {
      unwrap(await gen.Selora_ProcessOrderService.Run({ number: Number(orderId) }), 'Starting order processing')
    },

    async runRestockRequest(notificationId) {
      unwrap(await gen.Selora_RestockRequestService.Run({ number: Number(notificationId) }), 'Starting the restock email')
    },

    async runSupplierRequests() {
      return unwrap(await gen.Selora_SupplierRequestsService.Run({}), 'Loading restock requests') ?? {}
    },

    async runSupplierOffer(o) {
      const input = { number: o.requestId, number_1: o.quantity, number_2: o.unitCost, text: o.arriveBy, text_1: o.note }
      return unwrap(await gen.Selora_SupplierOfferService.Run(input), 'Sending the offer') ?? {}
    },
  }
}
