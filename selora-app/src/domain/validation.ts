import { CATEGORIES, SIZES, type ClothingInput } from './types'

export type ClothingErrors = Partial<Record<keyof ClothingInput, string>>

const MAX_PRICE = 1_000_000
const MAX_STOCK = 100_000

const blank = (n: number) => Number.isNaN(n)
// Compared with a tolerance: 19.99 * 100 is 1998.9999999999998 in floating point.
const twoDecimals = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6

/**
 * Field-by-field checks for the clothing form. `others` are the other items, used for
 * duplicate checks; the service passes none and leaves uniqueness to SharePoint.
 * A new item's blank SKU is fine: it is numbered on save.
 */
export function validateClothing(f: ClothingInput, others: { sku: string; name: string; size: string; colour: string }[] = []): ClothingErrors {
  const e: ClothingErrors = {}
  const name = f.name.trim()
  const sku = f.sku.trim()
  const colour = f.colour.trim()

  if (!name) e.name = 'Enter a name.'
  else if (name.length < 2) e.name = 'Use at least 2 characters.'
  else if (name.length > 100) e.name = 'Keep the name under 100 characters.'
  else if (
    others.some(
      (o) =>
        o.name.trim().toLowerCase() === name.toLowerCase() &&
        o.size === f.size &&
        o.colour.trim().toLowerCase() === colour.toLowerCase(),
    )
  )
    e.name = `There's already a ${name} in ${f.size}, ${colour || 'this colour'}. Edit that item instead.`

  if (f.id || sku) {
    if (!sku) e.sku = 'Enter a SKU.'
    else if (!/^[A-Za-z0-9-]{2,30}$/.test(sku)) e.sku = 'Use 2 to 30 letters, numbers or dashes, like TSH-004.'
    else if (others.some((o) => o.sku.trim().toLowerCase() === sku.toLowerCase())) e.sku = `${sku} is already used by another item.`
  }

  if (!(CATEGORIES as readonly string[]).includes(f.category)) e.category = 'Choose a category.'
  if (!(SIZES as readonly string[]).includes(f.size)) e.size = 'Choose a size.'

  if (!colour) e.colour = 'Pick a colour or type one.'
  else if (colour.length > 40) e.colour = 'Keep the colour under 40 characters.'
  else if (!/^[\p{L}][\p{L} '-]*$/u.test(colour)) e.colour = 'Use letters only, like Sky Blue.'

  if (blank(f.price)) e.price = 'Enter a price.'
  else if (f.price <= 0) e.price = 'Price must be more than 0.'
  else if (f.price > MAX_PRICE) e.price = 'That price looks too high. Check the number.'
  else if (!twoDecimals(f.price)) e.price = 'Use at most 2 decimal places.'

  if (blank(f.stock)) e.stock = 'Enter the stock, or 0.'
  else if (!Number.isInteger(f.stock) || f.stock < 0) e.stock = 'Stock must be a whole number, 0 or more.'
  else if (f.stock > MAX_STOCK) e.stock = 'That stock looks too high. Check the number.'

  if (blank(f.lowStockThreshold)) e.lowStockThreshold = 'Enter a low-stock level, or 0.'
  else if (!Number.isInteger(f.lowStockThreshold) || f.lowStockThreshold < 0)
    e.lowStockThreshold = 'Must be a whole number, 0 or more.'
  else if (f.lowStockThreshold > MAX_STOCK) e.lowStockThreshold = 'That level looks too high. Check the number.'

  return e
}
