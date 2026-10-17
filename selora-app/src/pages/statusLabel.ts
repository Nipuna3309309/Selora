import type { Order } from '../domain/types'

export function statusLabel(o: Order): { text: string; cls: string } {
  switch (o.processingStatus) {
    case 'Pending':
      return { text: 'Pending processing', cls: 'chip chip-wait' }
    case 'Processing':
      return { text: `Processing (${o.processingStage})`, cls: 'chip chip-wait' }
    case 'NeedsReview':
      return { text: 'Needs review', cls: 'chip chip-warn' }
    case 'Failed':
      return { text: 'Not placed', cls: 'chip chip-bad' }
    default:
      return o.status === 'Confirmed'
        ? { text: 'Confirmed', cls: 'chip chip-ok' }
        : { text: o.status, cls: 'chip' }
  }
}
