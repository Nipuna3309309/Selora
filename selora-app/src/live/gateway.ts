import { getContext } from '@microsoft/power-apps/app'
import * as gen from '../generated'
import type { ListName } from './columns'

/**
 * A SharePoint row as the gateway returns it. Shapes come from the generated models:
 *  - Choice columns arrive as `{ Value }`, lookups as `{ Id, Value }`, Person columns as `{ Email }`.
 *  - Created By is normalised to `CreatedByEmail`.
 * Writes use plain values: choices as strings, lookups as `<Column>#Id: number`.
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
  }
}
