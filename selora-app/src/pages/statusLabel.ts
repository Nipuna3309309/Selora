import type { Order } from '../domain/types'

export function statusLabel(o: Order): { text: string; cls: string } {
  switch (o.status) {
    case 'Pending':
      return { text: 'Pending processing', cls: 'chip chip-wait' }
    case 'Processing':
      return { text: `Processing (${o.processingStage})`, cls: 'chip chip-wait' }
    case 'NeedsReview':
      return { text: 'Needs review', cls: 'chip chip-warn' }
    case 'Rejected':
      return { text: 'Not placed', cls: 'chip chip-bad' }
    default:
      return { text: 'Confirmed', cls: 'chip chip-ok' }
  }
}
