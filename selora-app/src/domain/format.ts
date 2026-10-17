export const TIMEZONE = 'Asia/Colombo'

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Business date (YYYY-MM-DD) in Asia/Colombo for an ISO timestamp. */
export function businessDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function todayBusinessDate(): string {
  return businessDate(new Date().toISOString())
}

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100
export const round4 = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000

const lkr = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 2,
})
export const formatLkr = (n: number): string => lkr.format(n)

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { timeZone: TIMEZONE })
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${rand}`
}
