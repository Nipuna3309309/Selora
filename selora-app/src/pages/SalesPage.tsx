import { useMemo, type CSSProperties } from 'react'
import { BarList, ChartCard, LineChart, Sparkline } from '../components/charts'
import { CountUp } from '../components/CountUp'
import { useApp } from '../context'
import { bucket, compactNumber, lkrShort } from '../domain/dashboard'
import { formatDateTime, formatLkr } from '../domain/format'
import { buildSales } from '../domain/sales'
import { usePolled } from '../usePolled'
import { Tile } from './DashboardPage'

const pct = (n: number | null) => (n === null ? '–' : `${Math.round(n * 100)}%`)
const dayFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const formatKey = (key: string) =>
  key.length === 7 ? monthFmt.format(new Date(`${key}-01T00:00:00Z`)) : dayFmt.format(new Date(`${key}T00:00:00Z`))

/** Every confirmed sale since the shop opened: totals, the trend, and what sells. */
export function SalesPage({ refreshKey }: { refreshKey: string }) {
  const { service } = useApp()
  const orders = usePolled(() => service.listAllOrders(), [service, refreshKey])
  const clothes = usePolled(() => service.listClothes(), [service], 60000)
  const costs = usePolled(() => service.listCosts(), [service, refreshKey])
  const error = orders.error ?? clothes.error ?? costs.error
  const s = useMemo(
    () => (orders.data && clothes.data && costs.data ? buildSales(orders.data, clothes.data, costs.data) : null),
    [orders.data, clothes.data, costs.data],
  )

  if (error && !s) return <p className="notice notice-bad" role="alert">{error}</p>
  if (!s) return <div className="slip slip-skel" aria-busy="true" aria-label="Loading sales" />
  if (s.orders === 0)
    return (
      <div className="empty">
        <p>No confirmed sales yet. They show here as soon as the first order is confirmed.</p>
      </div>
    )

  const unit = s.granularity === 'day' ? 'day' : 'month'
  return (
    <div className="dash">
      <p className="muted">
        All confirmed sales since {formatKey(s.series[0].key)}. Profit is sales minus what each piece cost you when it was
        sold. Shop expenses aren't included.
      </p>

      <div className="kpis kpis-short">
        <div className="card hero" style={{ '--i': 0 } as CSSProperties}>
          <p className="stat-label">Gross profit</p>
          <p className="hero-value">
            <CountUp value={s.profit} format={formatLkr} />
          </p>
          <p className="muted small">
            {formatLkr(s.revenue)} in sales − {formatLkr(s.cogs)} paid for those pieces.
          </p>
          <Sparkline values={bucket(s.series.map((p) => p.profit))} />
        </div>
        <Tile i={1} label="Sales" trend={bucket(s.series.map((p) => p.revenue))}>
          {lkrShort(s.revenue)}
        </Tile>
        <Tile i={2} label="Paid for the pieces sold">{lkrShort(s.cogs)}</Tile>
        <Tile i={3} label="Profit margin" delta={<span className="delta delta-flat">Of every LKR 100 in sales</span>}>
          {pct(s.margin)}
        </Tile>
        <Tile i={4} label="Units sold">{compactNumber(s.units)}</Tile>
        <Tile i={5} label="Orders" trend={bucket(s.series.map((p) => p.orders))}>
          {compactNumber(s.orders)}
        </Tile>
        <Tile i={6} label="Average order">{s.aov === null ? '–' : lkrShort(s.aov)}</Tile>
      </div>

      <div className="chart-grid">
        <ChartCard
          className="span-2"
          title="Sales and profit"
          sub={`Per ${unit}, since the first sale`}
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{unit === 'day' ? 'Day' : 'Month'}</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Gross profit</th>
                  <th scope="col">Orders</th>
                </tr>
              </thead>
              <tbody>
                {s.series.filter((p) => p.orders > 0).map((p) => (
                  <tr key={p.key}>
                    <td data-label={unit === 'day' ? 'Day' : 'Month'}>{formatKey(p.key)}</td>
                    <td data-label="Sales">{formatLkr(p.revenue)}</td>
                    <td data-label="Gross profit">{formatLkr(p.profit)}</td>
                    <td data-label="Orders">{p.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <LineChart
            label={`Sales and gross profit per ${unit}`}
            points={s.series.map((p) => ({ x: p.key, y: p.revenue }))}
            series={{ main: 'Sales', second: 'Gross profit', values: s.series.map((p) => p.profit) }}
            format={formatLkr}
            formatTick={(n) => compactNumber(n)}
            formatX={formatKey}
            detail={(i) => [
              { label: 'Gross profit', value: formatLkr(s.series[i].profit) },
              { label: 'Orders', value: String(s.series[i].orders) },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Best sellers"
          sub="Items by gross profit"
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
                {s.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Item">{x.name}</td>
                    <td data-label="Gross profit">{formatLkr(x.profit)}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                    <td data-label="Units">{x.units}</td>
                    <td data-label="Margin">{pct(x.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No sales yet."
            format={lkrShort}
            rows={s.items.slice(0, 8).map((x) => ({
              key: x.id,
              label: x.name,
              value: x.profit,
              tip: [`${formatLkr(x.revenue)} sales`, `${x.units} units`, `${pct(x.margin)} margin`],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Profit by type"
          sub="Which kinds of clothing earn the most"
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Gross profit</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Units</th>
                </tr>
              </thead>
              <tbody>
                {s.categories.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Type">{x.name}</td>
                    <td data-label="Gross profit">{formatLkr(x.profit)}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                    <td data-label="Units">{x.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No sales yet."
            format={lkrShort}
            rows={s.categories.map((x) => ({
              key: x.id,
              label: x.name,
              value: x.profit,
              tip: [`${formatLkr(x.revenue)} sales`, `${x.units} units`, `${pct(x.margin)} margin`],
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Sizes sold"
          sub="Units per size, to guide what you reorder"
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  <th scope="col">Units</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {s.sizes.map((x) => (
                  <tr key={x.size}>
                    <td data-label="Size">{x.size}</td>
                    <td data-label="Units">{x.units}</td>
                    <td data-label="Share">{pct(x.units / s.units)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No sales yet."
            format={(n) => `${n}`}
            rows={s.sizes.map((x) => ({ key: x.size, label: x.size, value: x.units, tip: [`${pct(x.units / s.units)} of units`] }))}
          />
        </ChartCard>

        <ChartCard
          title="How customers pay"
          sub="Confirmed orders by payment"
          table={
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Payment</th>
                  <th scope="col">Orders</th>
                  <th scope="col">Sales</th>
                </tr>
              </thead>
              <tbody>
                {s.payments.map((x) => (
                  <tr key={x.label}>
                    <td data-label="Payment">{x.label}</td>
                    <td data-label="Orders">{x.orders}</td>
                    <td data-label="Sales">{formatLkr(x.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <BarList
            empty="No sales yet."
            format={lkrShort}
            rows={s.payments.map((x) => ({
              key: x.label,
              label: x.label,
              value: x.revenue,
              tip: [`${x.orders} ${x.orders === 1 ? 'order' : 'orders'}`, `${pct(x.revenue / s.revenue)} of sales`],
            }))}
          />
        </ChartCard>

        <section className="card span-2" aria-labelledby="recent-title">
          <header className="card-head">
            <div>
              <h3 id="recent-title">Latest sales</h3>
              <p className="muted small">The last {s.recent.length} confirmed orders and what each one earned</p>
            </div>
          </header>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Item</th>
                  <th scope="col">Sold for</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Profit</th>
                </tr>
              </thead>
              <tbody>
                {s.recent.map((r) => (
                  <tr key={r.orderId}>
                    <td data-label="When">{formatDateTime(r.date)}</td>
                    <td data-label="Customer">{r.customer || '–'}</td>
                    <td data-label="Item">
                      {r.quantity} × {r.item}
                    </td>
                    <td data-label="Sold for">{formatLkr(r.total)}</td>
                    <td data-label="Cost">{r.cost === null ? '–' : formatLkr(r.cost)}</td>
                    <td data-label="Profit">
                      <strong>{r.profit === null ? '–' : formatLkr(r.profit)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
