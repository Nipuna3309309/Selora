import type { CSSProperties } from 'react'
import { formatDateTime, formatLkr } from '../domain/format'
import type { Order } from '../domain/types'
import { Icon } from '../components/Icon'
import { useApp } from '../context'
import { isTerminal } from '../services/ShopService'
import { usePolled } from '../usePolled'
import { STAGES, stageIndex, statusLabel } from './orderView'

/** A seam of stitches that fills as the flow moves the order through its stages. */
function Tracker({ order }: { order: Order }) {
  const at = stageIndex(order.processingStage)
  const live = order.status === 'Pending' || order.status === 'Processing'
  const halted = order.status === 'NeedsReview'
  const done = order.status === 'Confirmed'
  const progress = done ? 1 : at / (STAGES.length - 1)
  return (
    <ol
      className="track"
      style={{ '--p': progress } as CSSProperties}
      aria-label={`Order progress: ${STAGES[at].label}, step ${at + 1} of ${STAGES.length}`}
    >
      {STAGES.map((s, i) => {
        const state = done || i < at ? 'done' : i === at ? (halted ? 'halt' : live ? 'now' : 'done') : 'todo'
        return (
          <li key={s.stage} className={state}>
            <span className="node">{state === 'done' ? <Icon name="check" size={12} /> : null}</span>
            <span>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function OrderList({ orders, showCustomer }: { orders: Order[]; showCustomer?: boolean }) {
  if (orders.length === 0) {
    return (
      <div className="empty">
        <p>No orders yet. When you buy something, it shows up here and you can watch it being processed.</p>
      </div>
    )
  }
  return (
    <div className="slips">
      {orders.map((o) => {
        const s = statusLabel(o)
        const rejected = o.status === 'Rejected'
        return (
          <article key={o.id} className={`slip tone-${s.tone}`}>
            <div className="slip-top">
              <div>
                <h3>
                  {o.clothingName || 'Clothing item'} <span className="muted">× {o.quantity}</span>
                </h3>
                <p className="muted small">
                  Order {o.id}, {formatDateTime(o.createdAt)}
                  {showCustomer && `, ${o.createdByEmail}`}
                </p>
              </div>
              <div className="slip-side">
                <span className={`chip tone-${s.tone}`}>{s.text}</span>
                {!rejected && <span className="price">{o.total > 0 ? formatLkr(o.total) : 'Total to be set'}</span>}
              </div>
            </div>
            {!rejected && <Tracker order={o} />}
            {o.resultMessage && (
              <p className={`result${rejected || o.status === 'NeedsReview' ? ' result-attn' : ''}`}>
                {o.resultMessage}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}

export function OrdersPage() {
  const { service } = useApp()
  // Refresh every 1.5 s until every order has a final result.
  const { data, error, loading, reload } = usePolled(
    () => service.listMyOrders(),
    [service],
    (d) => (d && d.some((o) => !isTerminal(o)) ? 1500 : null),
  )
  const waiting = (data ?? []).filter((o) => !isTerminal(o)).length
  return (
    <section aria-labelledby="orders-title">
      <div className="page-head">
        <h2 id="orders-title">My orders</h2>
        {waiting > 0 && (
          <p className="muted live-note">
            Updating {waiting} {waiting === 1 ? 'order' : 'orders'}…
          </p>
        )}
      </div>
      {error && (
        <div className="notice notice-bad" role="alert">
          <p>Couldn't load your orders. {error}</p>
          <button className="btn" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <div className="slip slip-skel" aria-busy="true" aria-label="Loading orders" />
      ) : (
        <OrderList orders={data ?? []} />
      )}
    </section>
  )
}
