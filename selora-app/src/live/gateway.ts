import { ConfigurationError } from '../services/ShopService'
import type { ListName } from './columns'

/** A SharePoint row. The gateway normalises person columns to `CreatedByEmail`. */
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
  /** OData filter, e.g. "Title eq 'CURRENT-3'". */
  filter?: string
  orderBy?: string
  top?: number
}

/**
 * The single place that talks to SharePoint. It must be implemented on top of
 * the generated Code Apps SharePoint services (`pac code add-data-source`),
 * which cannot exist until the site URL and connection are supplied. It must
 * throw UniqueViolationError when a create hits the unique index on Title.
 */
export interface SharePointGateway {
  currentUserEmail(): Promise<string>
  getItems(list: ListName, options?: GetItemsOptions): Promise<SpRow[]>
  createItem(list: ListName, fields: Record<string, unknown>): Promise<SpRow>
  updateItem(list: ListName, id: string, fields: Record<string, unknown>): Promise<SpRow>
}

/**
 * Placeholder until generated services exist. It fails loudly on purpose:
 * live mode must never silently fall back to demo data.
 */
export function createGateway(): SharePointGateway {
  throw new ConfigurationError(
    'Live mode is selected but no SharePoint connection is wired. Add the SharePoint data source with the Power Apps CLI and implement src/live/gateway.ts (see docs/connected-setup.md).',
  )
}
