import { useState } from 'react'
import { useApp } from '../context'
import { isRecentRestock } from '../domain/restock'
import type { RestockRequest } from '../domain/types'
import { Icon } from './Icon'

const EMAIL_STATE: Record<RestockRequest['emailStatus'], string> = {
  Pending: 'email on its way',
  Sent: 'email sent',
  Failed: 'not sent (check a Supplier is set up in Users)',
}

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/**
 * Asks the suppliers for more stock of one item. The click adds a RestockRequest row to
 * Notifications, and the Restock Request flow emails every user whose Role is Supplier.
 */
export function RestockButton({
  clothingId,
  name,
  suggested,
  last,
  onSent,
}: {
  clothingId: string
  name: string
  /** Units to suggest in the email. */
  suggested?: number
  last?: RestockRequest
  onSent: () => void
}) {
  const { service } = useApp()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string>()

  async function send() {
    setState('sending')
    setError(undefined)
    try {
      await service.requestRestock(clothingId, suggested ? `Suggested order: ${suggested} units.` : '')
      setState('sent')
      onSent()
    } catch (e) {
      setState('idle')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const recent = isRecentRestock(last)
  return (
    <span className="restock">
      {state === 'sent' ? (
        <span className="restock-status" role="status">
          <Icon name="check" size={16} />
          Sent to suppliers
        </span>
      ) : (
        <>
          {recent && (
            <span className={`restock-status${last.emailStatus === 'Failed' ? ' is-failed' : ''}`}>
              <Icon name={last.emailStatus === 'Failed' ? 'alert' : 'check'} size={16} />
              Asked suppliers {time(last.createdAt)}, {EMAIL_STATE[last.emailStatus]}
            </span>
          )}
          <button
            className="btn btn-small"
            onClick={() => void send()}
            disabled={state === 'sending'}
            aria-label={`${recent ? 'Ask again for' : 'Request restock of'} ${name}`}
          >
            <Icon name="send" size={16} />
            {state === 'sending' ? 'Sending…' : recent ? 'Ask again' : 'Request restock'}
          </button>
        </>
      )}
      {error && (
        <span className="restock-error" role="alert">
          Couldn't send: {error}
        </span>
      )}
    </span>
  )
}
