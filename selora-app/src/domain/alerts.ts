import type { StockAlertState } from './types'

/**
 * State written when an admin edits stock. Restocking above the threshold
 * re-arms alerts. At or below it, the state records "already alerted" so
 * repeat sales stay quiet until stock recovers.
 */
export function stateAfterAdminEdit(
  prev: StockAlertState,
  stock: number,
  threshold: number,
): StockAlertState {
  if (stock > threshold) return 'None'
  if (stock === 0) return 'Zero'
  return prev === 'None' ? 'Low' : prev
}

export function validateClothingNumbers(price: number, stock: number, threshold: number): void {
  if (!(price >= 0)) throw new Error('Price must be zero or more.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a whole number, zero or more.')
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('Low-stock threshold must be a whole number, zero or more.')
  }
}
