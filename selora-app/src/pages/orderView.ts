import type { Order, ProcessingStage } from '../domain/types'

export type Tone = 'ok' | 'wait' | 'warn' | 'bad'

export function statusLabel(o: Order): { text: string; tone: Tone } {
  switch (o.status) {
    case 'Pending':
      return { text: 'Waiting to be processed', tone: 'wait' }
    case 'Processing':
      return { text: 'Processing', tone: 'wait' }
    case 'NeedsReview':
      return { text: 'Needs review', tone: 'warn' }
    case 'Rejected':
      return { text: 'Not placed', tone: 'bad' }
    default:
      return { text: 'Confirmed', tone: 'ok' }
  }
}

/** The flow's real stages, in order. */
export const STAGES: { stage: ProcessingStage; label: string }[] = [
  { stage: 'New', label: 'Received' },
  { stage: 'Prepared', label: 'Prepared' },
  { stage: 'StockUpdated', label: 'Stock set' },
  { stage: 'Completed', label: 'Confirmed' },
]

export function stageIndex(stage: ProcessingStage): number {
  return Math.max(0, STAGES.findIndex((s) => s.stage === stage))
}
