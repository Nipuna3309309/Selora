import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { BarList, ChartCard, LineChart, Sparkline } from '../components/charts'
import { CountUp } from '../components/CountUp'
import { Icon, type IconName } from '../components/Icon'
import { RestockButton } from '../components/RestockButton'
import { useApp } from '../context'
import {
  bucket,
  buildDashboard,
  compactNumber,
  lkrShort,
  type AdminSection,
  type Decision,
  type RangeDays,
  type Severity,
} from '../domain/dashboard'
import { formatLkr } from '../domain/format'
import { latestRestock } from '../domain/restock'
import type { RestockRequest } from '../domain/types'
import { usePolled } from '../usePolled'

const RANGES: { days: RangeDays; label: string }[] = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

const SEVERITY: Record<Severity, { label: string; icon: IconName }> = {
  critical: { label: 'Act now', icon: 'alert' },
  warning: { label: 'This week', icon: 'alert' },
  info: { label: 'Worth a look', icon: 'info' },
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatDay = (date: string) => dayFmt.format(new Date(`${date}T00:00:00Z`))
const pct = (n: number) => `${Math.round(n * 100)}%`

/** Change against the previous period. `upIsGood` decides the colour, an arrow and words carry the direction. */
function Delta({ now, before, upIsGood = true, points, range }: {
  now: number | null
  before: number | null
  upIsGood?: boolean
  /** Show the change in percentage points (for margins). */
  points?: boolean
  range: RangeDays
}) {
  const vs = `vs previous ${range} days`
  if (now === null || before === null) return <span className="delta delta-flat">No sales to compare {vs}</span>
  if (!points && before === 0) {
    return <span className="delta delta-flat">{now === 0 ? 'No change' : `None in the previous ${range} days`}</span>
  }
  const change = points ? (now - before) * 100 : ((now - before) / Math.abs(before)) * 100
  const rounded = Math.round(change)
  if (rounded === 0) return <span className="delta delta-flat">No change {vs}</span>
  const up = rounded > 0
  const good = up === upIsGood
  return (
    <span className={`delta ${good ? 'delta-good' : 'delta-bad'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {up ? 'Up' : 'Down'} {Math.abs(rounded)}
      {points ? ' pts' : '%'} {vs}
    </span>
  )
}

export function Tile({ label, children, delta, trend, i }: {
  label: string
  children: ReactNode
  delta?: ReactNode
  trend?: number[]
  i: number
}) {
  return (
    <div className="card tile-stat" style={{ '--i': i } as CSSProperties}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{children}</p>
      {delta}
      {trend && <Sparkline values={trend} />}
    </div>
  )
}

function DecisionCard({
  d,
  i,
  onGo,
  lastRestock,
  onRestocked,
}: {
  d: Decision
  i: number
  onGo: (s: AdminSection) => void
  lastRestock?: RestockRequest
  onRestocked: () => void
}) {
  const s = SEVERITY[d.severity]
  return (
    <li className={`decision sev-${d.severity}`} style={{ '--i': i } as CSSProperties}>
      <span className="sev">
        <Icon name={s.icon} size={16} />
        {s.label}
      </span>
      <div className="decision-text">
        <h4>{d.title}</h4>
        <p className="muted">{d.detail}</p>
      </div>
      <div className="decision-side">
        {d.impactLabel && <span className="impact">{d.impactLabel}</span>}
        {d.restock && (
          <RestockButton
            clothingId={d.restock.clothingId}
            name={d.restock.name}
            suggested={d.restock.quantity}
            last={lastRestock}
            onSent={onRestocked}
          />
        )}
        <button className="btn btn-small" onClick={() => onGo(d.target)}>
          {d.action}
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </li>
  )
}

export function DashboardPage({ onGo }: { onGo: (s: AdminSection) => void }) {
  const { service } = useApp()
  const [range, setRange] = useState<RangeDays>(30)
  const [showAll, setShowAll] = useState(false)
  const orders = usePolled(() => service.listAllOrders(), [service], 5000)
  const clothes = usePolled(() => service.listClothes(), [service], 30000)
  const costs = usePolled(() => service.listCosts(), [service], 30000)
  const restocks = usePolled(() => service.listRestockRequests(), [service], 15000)
  const lastRestock = useMemo(() => latestRestock(restocks.data), [restocks.data])
  const error = orders.error ?? clothes.error ?? costs.error
  const ready = orders.data && clothes.data && costs.data

  const d = useMemo(
    () => (ready ? buildDashboard(orders.data!, clothes.data!, costs.data!, range) : null),
    [ready, orders.data, clothes.data, costs.data, range],
  )

  const head = (
    <div className="page-head dash-head">
      <div>
        <h2 id="dash-title">Dashboard</h2>
        {d && (
          <p className="muted">
            {formatDay(d.from)} to {formatDay(d.to)}, confirmed sales only
          </p>
        )}
      </div>
      <div className="range" role="radiogroup" aria-label="Period">
        {RANGES.map((r) => (
          <button key={r.days} role="radio" aria-checked={range === r.days} onClick={() => setRange(r.days)}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )

  if (error && !d) {
    return (
      <section aria-labelledby="dash-title">
        {head}
        <div className="notice notice-bad" role="alert">
          <p>Couldn't load the dashboard. {error}</p>
          <button className="btn" onClick={() => void Promise.all([orders.reload(), clothes.reload(), costs.reload()])}>
            Try again
          </button>
        </div>
      </section>
    )
  }
  if (!d) {
    return (
      <section aria-labelledby="dash-title" aria-busy="true">
        {head}
        <div className="dash-skel">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="slip slip-skel" />
          ))}
        </div>
      </section>
    )
  }

  const { now, before } = d
  const revenueTrend = bucket(d.days.map((x) => x.revenue))
  const profitTrend = bucket(d.days.map((x) => x.profit))
  const ordersTrend = bucket(d.days.map((x) => x.orders))
  const placed = d.outcomes.reduce((s, o) => s + o.count, 0)
  const confirmedShare = placed ? (d.outcomes[0].count / placed) : null
  const shown = showAll ? d.decisions : d.decisions.slice(0, 4)
  const urgent = d.decisions.filter((x) => x.severity === 'critical').length

  return (
    <section aria-labelledby="dash-title" className="dash">
      {head}
      {error && <p className="notice notice-warn">Showing the last figures loaded. {error}</p>}

      <section className="card decisions" aria-labelledby="dec-title">
        <header className="card-head">
          <div>
            <h3 id="dec-title">Decisions needed</h3>
            <p className="muted small">
              {d.decisions.length === 0
                ? 'Ranked by urgency, then by money at stake'
                : `${d.decisions.length} ${d.decisions.length === 1 ? 'item' : 'items'}${urgent ? `, ${urgent} to act on now` : ''}. Ranked by urgency, then by money at stake.`}
            </p>
          </div>
        </header>
        {d.decisions.length === 0 ? (
          <p className="all-clear">
            <Icon name="check" />
            Nothing needs a decision right now. Stock, costs and prices are all in good shape.
          </p>
        ) : (
          <>
            <ol className="decision-list">
              {shown.map((x, i) => (
                <DecisionCard
                  key={x.id}
                  d={x}
                  i={i}
                  onGo={onGo}
                  lastRestock={x.restock && lastRestock.get(x.restock.clothingId)}
                  onRestocked={() => void restocks.reload()}
                />
              ))}
            </ol>
            {d.decisions.length > 4 && (
              <button className="ghost-btn more" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                {showAll ? 'Show fewer' : `Show ${d.decisions.length - 4} more`}
              </button>
            )}
          </>
        )}
      </section>

      <div className="kpis">
        <div className="card hero" style={{ '--i': 0 } as CSSProperties}>
          <p className="stat-label">Gross profit</p>
          <p className="hero-value">
            <CountUp value={now.profit} format={formatLkr} />
          </p>
          <Delta now={now.profit} before={before.profit} range={range} />
          <p className="muted small">
            {now.margin === null ? 'No confirmed sales in this period.' : `${pct(now.margin)} of ${formatLkr(now.revenue)} in sales. Expenses are not included.`}
          </p>
          <Sparkline values={profitTrend} />
        </div>
        <Tile
          i={1}
          label="Sales"
          delta={<Delta now={now.revenue} before={before.revenue} range={range} />}
          trend={revenueTrend}
        >
          {lkrShort(now.revenue)}
        </Tile>
        <Tile
          i={2}
          label="Gross margin"
          delta={<Delta now={now.margin} before={before.margin} points range={range} />}
        >
          {now.margin === null ? '–' : pct(now.margin)}
        </Tile>
        <Tile
          i={3}
          label="Confirmed orders"
          delta={<Delta now={now.confirmed} before={before.confirmed} range={range} />}
          trend={ordersTrend}
        >
          {compactNumber(now.confirmed)}
        </Tile>
        <Tile i={4} label="Average order" delta={<Delta now={now.aov} before={before.aov} range={range} />}>
          {now.aov === null ? '–' : lkrShort(now.aov)}
        </Tile>
        <Tile
          i={5}
          label="Turned away"
          delta={<Delta now={now.lostValue} before={before.lostValue} upIsGood={false} range={range} />}
        >
          {lkrShort(now.lostValue)}
        </Tile>
        <Tile i={6} label="Stock value at cost" delta={<span className="delta delta-flat">Money tied up in stock today</span>}>
          {lkrShort(d.stockValue)}
        </Tile>
        <Tile
          i={7}
          label="Profit on cost"
          delta={<Delta now={now.markup} before={before.markup} points range={range} />}
        >
          {now.markup === null ? '–' : pct(now.markup)}
        </Tile>
        <Tile
          i={8}
          label="Spent on stock"
          delta={<span className="delta delta-flat">Bought in the last {range} days</span>}
        >
          {lkrShort(now.spent)}
        </Tile>
        <Tile
          i={9}
          label="Profit waiting in stock"
          delta={<span className="delta delta-flat">If today's stock sells at today's prices</span>}
        >
          {lkrShort(d.stockProfit)}
        </Tile>
      </div>

      <div className="chart-grid">
        <ChartCard
          className="span-2"
          title="Sales and profit"
          sub={`Confirmed sales and gross profit per day, last ${range} days`}
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Gross profit</th>
                  <th scope="col">Orders</th>
                </tr>
              </thead>
              <tbody>
                {d.days.filter((x) => x.orders > 0).map((x) => (
                  <tr key={x.date}>
                    <td data-label="Day">{formatDay(x.date)}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                    <td data-label="Gross profit">{formatLkr(x.profit)}</td>
                    <td data-label="Orders">{x.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          {now.revenue === 0 ? (
            <p className="muted chart-empty">No confirmed sales in this period.</p>
          ) : (
            <LineChart
              label={`Daily sales and gross profit over the last ${range} days`}
              points={d.days.map((x) => ({ x: x.date, y: x.revenue }))}
              series={{ main: 'Sales', second: 'Gross profit', values: d.days.map((x) => x.profit) }}
              format={formatLkr}
              formatTick={(n) => compactNumber(n)}
              formatX={formatDay}
              detail={(i) => [
                { label: 'Gross profit', value: formatLkr(d.days[i].profit) },
                { label: 'Orders', value: String(d.days[i].orders) },
              ]}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Best earners"
          sub="Top items by gross profit"
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Gross profit</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Units</th>
                  <th scope="col">Margin</th>
                </tr>
              </thead>
              <tbody>
                {d.topItems.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Item">{x.name}</td>
                    <td data-label="Gross profit">{formatLkr(x.profit)}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                    <td data-label="Units">{x.units}</td>
                    <td data-label="Margin">{x.margin === null ? '–' : pct(x.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No confirmed sales in this period."
            format={lkrShort}
            rows={d.topItems.map((x) => ({
              key: x.id,
              label: x.name,
              value: x.profit,
              tip: [`${formatLkr(x.revenue)} sales`, `${x.units} units`, `${x.margin === null ? '–' : pct(x.margin)} margin`],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Profit by category"
          sub="Gross profit per clothing type, against its profit rule"
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Gross profit</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Profit on cost</th>
                  <th scope="col">Rule</th>
                </tr>
              </thead>
              <tbody>
                {d.categories.map((x) => (
                  <tr key={x.name}>
                    <td data-label="Category">{x.name}</td>
                    <td data-label="Gross profit">{formatLkr(x.profit)}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                    <td data-label="Profit on cost">{x.markup === null ? '–' : pct(x.markup)}</td>
                    <td data-label="Rule">{x.rule ?? 'Not set'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No confirmed sales in this period."
            format={lkrShort}
            rows={d.categories.map((x) => ({
              key: x.name,
              label: x.name,
              value: x.profit,
              tip: [
                `${formatLkr(x.revenue)} sales`,
                `${x.markup === null ? '–' : pct(x.markup)} profit on cost`,
                x.rule ? `Rule: ${x.rule}` : 'No profit rule set',
              ],
            }))}
          />
        </ChartCard>

        <ChartCard
          className="span-2"
          title="What happened to orders"
          sub={
            confirmedShare === null
              ? 'No orders placed in this period'
              : `${pct(confirmedShare)} of ${placed} ${placed === 1 ? 'order' : 'orders'} confirmed`
          }
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Outcome</th>
                  <th scope="col">Orders</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {d.outcomes.map((x) => (
                  <tr key={x.key}>
                    <td data-label="Outcome">{x.label}</td>
                    <td data-label="Orders">{x.count}</td>
                    <td data-label="Share">{placed ? pct(x.count / placed) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No orders placed in this period."
            format={(n) => String(n)}
            rows={
              placed === 0
                ? []
                : d.outcomes.map((x) => ({
                    key: x.key,
                    label: x.label,
                    value: x.count,
                    tip: [`${pct(x.count / placed)} of orders`],
                  }))
            }
          />
        </ChartCard>
      </div>
    </section>
  )
}
