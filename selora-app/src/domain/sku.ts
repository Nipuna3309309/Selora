import type { CATEGORIES } from './types'

/** SKU prefix per clothing type. New items get <PREFIX>-<number>, numbered per type. */
export const SKU_PREFIX: Record<(typeof CATEGORIES)[number], string> = {
  'T-Shirt': 'TSH',
  Shirt: 'SHT',
  Trousers: 'TRS',
  Dress: 'DRS',
  Shorts: 'SHR',
  Other: 'OTH',
}

const prefixFor = (category: string): string =>
  SKU_PREFIX[category as keyof typeof SKU_PREFIX] ?? SKU_PREFIX.Other

/**
 * The next free SKU for a clothing type: one more than the highest number already used with
 * that prefix (gaps are never refilled, so a deleted item's SKU isn't reused). `skip` moves
 * further on, for a retry after another admin took the number first.
 */
export function nextSku(category: string, existing: string[], skip = 0): string {
  const prefix = prefixFor(category)
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i')
  let max = 0
  for (const sku of existing) {
    const m = pattern.exec(sku.trim())
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `${prefix}-${String(max + 1 + skip).padStart(3, '0')}`
}
