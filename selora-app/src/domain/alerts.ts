export type StockCrossing = 'none' | 'low' | 'zero'

/**
 * Stateless alert rule, so no extra column is needed. An alert fires only when
 * a sale moves stock across a boundary, which makes repeats impossible until
 * stock rises back above the threshold and falls again.
 *  - zero: stock was above 0 and is now 0
 *  - low:  stock was above the threshold and is now at or below it (but not 0)
 * A sale from above the threshold straight to 0 sends only the zero alert.
 */
export function stockCrossing(before: number, after: number, threshold: number): StockCrossing {
  if (after <= 0 && before > 0) return 'zero'
  if (after > 0 && before > threshold && after <= threshold) return 'low'
  return 'none'
}

export function validateClothingNumbers(price: number, stock: number, threshold: number): void {
  if (!(price >= 0)) throw new Error('Price must be zero or more.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a whole number, zero or more.')
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('Low-stock threshold must be a whole number, zero or more.')
  }
}
