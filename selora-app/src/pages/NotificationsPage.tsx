import { formatDateTime } from '../domain/format'
import { useApp } from '../context'
import { usePolled } from '../usePolled'

export function NotificationsPage({ onChanged }: { onChanged: () => void }) {
  const { service } = useApp()
  const { data, error, loading, reload } = usePolled(() => service.listMyNotifications(), [service], 5000)

  async function markRead(id: string) {
    await service.markNotificationRead(id)
    await reload()
    onChanged()
  }

  return (
    <section>
      <h2>Notifications</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading notifications…</p>}
      {!loading && (data ?? []).length === 0 && <p className="muted">No notifications.</p>}
      <div className="list">
        {(data ?? []).map((n) => (
          <article key={n.id} className={`row-card${n.isRead ? '' : ' unread'}`}>
            <div className="row-head">
              <span>
                {!n.isRead && <span className="dot" aria-label="Unread" />}
                {n.message}
              </span>
              {!n.isRead && <button onClick={() => void markRead(n.id)}>Mark as read</button>}
            </div>
            <div className="muted">{formatDateTime(n.createdAt)}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
