import type { CSSProperties } from 'react'
import { formatDateTime, formatLkr } from '../domain/format'
import { groupOrders, type GroupStatus, type OrderGroup } from '../domain/checkout'
import type { Order } from '../domain/types'
import { Icon } from '../components/Icon'
import { useApp } from '../context'
import { isTerminal } from '../services/ShopService'
import { usePolled } from '../usePolled'
import { STAGES, stageIndex, type Tone } from './orderView'

const GROUP_LABEL: Record<GroupStatus, { text: string; tone: Tone }> = {
  Pending: { text: 'Waiting to be processed', tone: 'wait' },
  Processing: { text: 'Processing', tone: 'wait' },
  Confirmed: { text: 'Confirmed', tone: 'ok' },
  Partial: { text: 'Partly confirmed', tone: 'warn' },
  Rejected: { text: 'Not placed', tone: 'bad' },
  NeedsReview: { text: 'Needs review', tone: 'warn' },
}

const LINE_LABEL: Record<Order['status'], { text: string; tone: Tone }> = {
  Pending: { text: 'Waiting', tone: 'wait' },
  Processing: { text: 'Processing', tone: 'wait' },
  Confirmed: { text: 'Confirmed', tone: 'ok' },
  Rejected: { text: 'Not placed', tone: 'bad' },
  NeedsReview: { text: 'Needs review', tone: 'warn' },
}

/** A seam of stitches that fills as the flow moves the order's items through their stages. */
function Tracker({ group }: { group: OrderGroup }) {
  const open = group.lines.filter((l) => l.status !== 'Rejected')
  const at = open.length === 0 ? 0 : Math.min(...open.map((l) => stageIndex(l.processingStage)))
  const live = group.status === 'Pending' || group.status === 'Processing'
  const halted = group.status === 'NeedsReview'
  const done = group.status === 'Confirmed' || group.status === 'Partial'
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
  const groups = groupOrders(orders)
  if (groups.length === 0) {
    return (
      <div className="empty">
        <p>No orders yet. When you place an order, it shows up here and you can watch it being processed.</p>
      </div>
    )
  }
  return (
    <div className="slips">
      {groups.map((g, i) => {
        const s = GROUP_LABEL[g.status]
        const rejected = g.status === 'Rejected'
        const notes = g.lines.filter((l) => l.resultMessage && (l.status === 'Rejected' || l.status === 'NeedsReview'))
        return (
          <article key={g.id} className={`slip tone-${s.tone}`} style={{ '--i': Math.min(i, 10) } as CSSProperties}>
            <div className="slip-top">
              <div>
                <h3>Order {g.code}</h3>
                <p className="muted small">
                  {formatDateTime(g.createdAt)}
                  {showCustomer && `, ${g.createdByEmail}`}
                  {g.lines[0].simulatedPayment === 'Cash on delivery' ? ', cash on delivery' : g.lines[0].simulatedPayment === 'Success' ? ', paid' : ''}
                </p>
              </div>
              <div className="slip-side">
                <span className={`chip tone-${s.tone}`}>{s.text}</span>
                {!rejected && <span className="price">{g.total !== null ? formatLkr(g.total) : 'Total to be set'}</span>}
              </div>
            </div>
            <ul className="slip-lines">
              {g.lines.map((l) => (
                <li key={l.id}>
                  <span>
                    {l.clothingName || 'Clothing item'} <span className="muted">× {l.quantity}</span>
                  </span>
                  {g.lines.length > 1 && <span className={`chip tone-${LINE_LABEL[l.status].tone}`}>{LINE_LABEL[l.status].text}</span>}
                </li>
              ))}
            </ul>
            {!rejected && <Tracker group={g} />}
            {notes.map((l) => (
              <p key={l.id} className="result result-attn">
                {g.lines.length > 1 ? `${l.clothingName}: ` : ''}
                {l.resultMessage}
              </p>
            ))}
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
