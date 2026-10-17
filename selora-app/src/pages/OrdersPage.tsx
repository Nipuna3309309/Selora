import { formatDateTime, formatLkr } from '../domain/format'
import type { Order } from '../domain/types'
import { useApp } from '../context'
import { isTerminal } from '../services/ShopService'
import { usePolled } from '../usePolled'
import { statusLabel } from './statusLabel'

export function OrderList({ orders, showCustomer }: { orders: Order[]; showCustomer?: boolean }) {
  if (orders.length === 0) return <p className="muted">No orders yet.</p>
  return (
    <div className="list">
      {orders.map((o) => {
        const s = statusLabel(o)
        return (
          <article key={o.id} className="row-card">
            <div className="row-head">
              <strong>
                {o.clothingName || 'Clothing item'} × {o.quantity}
              </strong>
              <span className={s.cls}>{s.text}</span>
            </div>
            <div className="muted">
              Order {o.id} · {formatDateTime(o.createdAt)}
              {showCustomer && ` · ${o.createdByEmail}`}
            </div>
            <div>{o.total > 0 ? `Total ${formatLkr(o.total)}` : 'Total pending'}</div>
            <div className={o.processingStatus === 'Failed' || o.processingStatus === 'NeedsReview' ? 'error' : 'muted'}>
              {o.resultMessage}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function OrdersPage() {
  const { service } = useApp()
  // Refresh every 1.5s until every order has reached a terminal result.
  const { data, error, loading } = usePolled(
    () => service.listMyOrders(),
    [service],
    (d) => (d && d.some((o) => !isTerminal(o)) ? 1500 : null),
  )
  const waiting = (data ?? []).filter((o) => !isTerminal(o)).length
  return (
    <section>
      <h2>My orders</h2>
      {waiting > 0 && <p className="banner banner-wait">Processing {waiting} order(s)… this page refreshes automatically.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="muted">Loading orders…</p> : <OrderList orders={data ?? []} />}
    </section>
  )
}
