export function validateClothingNumbers(price: number, stock: number, threshold: number): void {
  if (!(price >= 0)) throw new Error('Price must be zero or more.')
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock must be a whole number, zero or more.')
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('Low-stock threshold must be a whole number, zero or more.')
  }
}
