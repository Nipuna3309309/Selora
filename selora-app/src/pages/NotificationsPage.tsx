import type { CSSProperties } from 'react'
import { formatDateTime } from '../domain/format'
import type { AppNotification } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'
import type { Tone } from './orderView'

const KIND: Record<AppNotification['type'], { label: string; tone: Tone }> = {
  OrderConfirmed: { label: 'Order confirmed', tone: 'ok' },
  OrderRejected: { label: 'Order not placed', tone: 'bad' },
  LowStock: { label: 'Low stock', tone: 'warn' },
  OutOfStock: { label: 'Out of stock', tone: 'bad' },
  NeedsReview: { label: 'Needs review', tone: 'warn' },
}

export function NotificationsPage({ onChanged }: { onChanged: () => void }) {
  const { service } = useApp()
  const { data, error, loading, reload } = usePolled(() => service.listMyNotifications(), [service], 5000)
  const unread = (data ?? []).filter((n) => !n.isRead).length

  async function markRead(id: string) {
    await service.markNotificationRead(id)
    await reload()
    onChanged()
  }

  return (
    <section aria-labelledby="notes-title">
      <div className="page-head">
        <h2 id="notes-title">Notifications</h2>
        {data && <p className="muted">{unread === 0 ? 'All read' : `${unread} unread`}</p>}
      </div>
      {error && (
        <div className="notice notice-bad" role="alert">
          <p>Couldn't load notifications. {error}</p>
          <button className="btn" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}
      {loading && <div className="slip slip-skel" aria-busy="true" aria-label="Loading notifications" />}
      {!loading && !error && (data ?? []).length === 0 && (
        <div className="empty">
          <p>Nothing here yet. Order updates and stock alerts will appear as they happen.</p>
        </div>
      )}
      <div className="slips">
        {(data ?? []).map((n, i) => {
          const k = KIND[n.type] ?? { label: n.type, tone: 'wait' as Tone }
          return (
            <article
              key={n.id}
              className={`note tone-${k.tone}${n.isRead ? ' read' : ''}`}
              style={{ '--i': Math.min(i, 10) } as CSSProperties}
            >
              <div>
                <p className="note-kind">
                  {!n.isRead && <span className="dot" aria-hidden="true" />}
                  {k.label}
                  {!n.isRead && <span className="sr-only">, unread</span>}
                </p>
                <p>{n.message}</p>
                <p className="muted small">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button className="btn" onClick={() => void markRead(n.id)}>
                  Mark as read
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
