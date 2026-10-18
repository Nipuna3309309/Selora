import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './Icon'

/*
 * Small charts for the dashboard. The primary hue for every mark, plus green for the one
 * second line (profit against sales), hairline solid grid, text in text colours, a hover/focus readout on every chart,
 * and a table view on every card so no value depends on hovering.
 */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Rounds a maximum up to 1, 2 or 5 times a power of ten so ticks land on clean numbers. */
function niceMax(max: number): number {
  if (max <= 0) return 1
  const step = Math.pow(10, Math.floor(Math.log10(max / 4)))
  for (const m of [1, 2, 2.5, 5, 10]) if (step * m * 4 >= max) return step * m * 4
  return max
}

export function ChartCard({
  title,
  sub,
  table,
  children,
  className = '',
}: {
  title: string
  sub?: ReactNode
  table: ReactNode
  children: ReactNode
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <figure className={`card chart-card ${className}`}>
      <header className="card-head">
        <div>
          <h3>{title}</h3>
          {sub && <p className="muted small">{sub}</p>}
        </div>
        <button className="ghost-btn" aria-pressed={asTable} onClick={() => setAsTable((t) => !t)}>
          <Icon name={asTable ? 'chart' : 'table'} size={16} />
          {asTable ? 'Chart' : 'Table'}
        </button>
      </header>
      <div className="card-body" key={String(asTable)}>
        {asTable ? <div className="table-scroll">{table}</div> : children}
      </div>
    </figure>
  )
}

const PAD = { top: 18, right: 14, bottom: 30, left: 56 }
const PLOT_H = 200

export function LineChart({
  points,
  label,
  format,
  formatTick,
  formatX,
  detail,
  series,
}: {
  points: { x: string; y: number }[]
  label: string
  format: (n: number) => string
  formatTick: (n: number) => string
  formatX: (x: string) => string
  detail?: (i: number) => { label: string; value: string }[]
  /** Names for a legend, and a second line drawn against the same axis (one value per point). */
  series?: { main: string; second: string; values: number[] }
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const n = points.length
  const max = niceMax(Math.max(0, ...points.map((p) => p.y), ...(series?.values ?? [])))
  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => PAD.top + PLOT_H - (Math.max(0, v) / max) * PLOT_H
  const base = PAD.top + PLOT_H
  const path = (ys: number[]) => ys.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const line = path(points.map((p) => p.y))
  const second = series ? path(series.values) : ''
  const area = n ? `${line}L${x(n - 1).toFixed(1)},${base}L${x(0).toFixed(1)},${base}Z` : ''
  const ticks = [0, 1, 2, 3, 4].map((k) => (max / 4) * k)
  const xTicks = n <= 1 ? [0] : [...new Set([0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4)))]
  const last = n - 1

  function pick(clientX: number) {
    const rect = ref.current!.getBoundingClientRect()
    const rel = (clientX - rect.left - PAD.left) / (plotW || 1)
    setActive(Math.min(n - 1, Math.max(0, Math.round(rel * (n - 1)))))
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const d = e.key === 'ArrowRight' ? 1 : -1
      setActive((a) => Math.min(n - 1, Math.max(0, (a ?? last) + d)))
    } else if (e.key === 'Escape') setActive(null)
  }

  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 90), width - 90)
  return (
    <div
      ref={ref}
      className="line-chart"
      role="group"
      tabIndex={0}
      aria-label={`${label}. Use the left and right arrow keys to read each day.`}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onFocus={() => setActive((a) => a ?? last)}
      onBlur={() => setActive(null)}
      onKeyDown={onKey}
    >
      {series && (
        <ul className="chart-legend" aria-hidden="true">
          <li>
            <span className="key" />
            {series.main}
          </li>
          <li>
            <span className="key key-second" />
            {series.second}
          </li>
        </ul>
      )}
      {width > 0 && (
        <svg width={width} height={PLOT_H + PAD.top + PAD.bottom} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="tick" x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end">
                {formatTick(t)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text
              key={i}
              className="tick"
              x={x(i)}
              y={base + 20}
              textAnchor={n > 1 && i === 0 ? 'start' : n > 1 && i === last ? 'end' : 'middle'}
            >
              {formatX(points[i].x)}
            </text>
          ))}
          <path className="area" d={area} />
          <path className="line" d={line} pathLength={1} key={`${n}-${max}`} />
          {series && <path className="line line-second" d={second} pathLength={1} key={`s-${n}-${max}`} />}
          {active !== null && <line className="crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={base} />}
          {series && n > 0 && (
            <circle className="dot dot-second" cx={x(active ?? last)} cy={y(series.values[active ?? last])} r={4} />
          )}
          {n > 0 && (
            <circle className="dot" cx={x(active ?? last)} cy={y(points[active ?? last].y)} r={4.5} />
          )}
          {active === null && n > 0 && (
            <text className="end-label" x={x(last)} y={y(points[last].y) - 12} textAnchor="end">
              {format(points[last].y)}
            </text>
          )}
        </svg>
      )}
      {active !== null && (
        <div className="chart-tip" style={{ left: tipLeft }} aria-live="polite">
          <strong>{format(points[active].y)}</strong>
          <span className="muted">{formatX(points[active].x)}</span>
          {detail?.(active).map((d) => (
            <span key={d.label} className="tip-row">
              <span className="muted">{d.label}</span> {d.value}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export interface BarRow {
  key: string
  label: string
  value: number
  /** Extra lines for the hover/focus readout. */
  tip?: string[]
}

/** Horizontal bars from one baseline, value at the tip. Negative values show as a value with no bar. */
export function BarList({ rows, format, empty }: { rows: BarRow[]; format: (n: number) => string; empty: string }) {
  if (rows.length === 0) return <p className="muted chart-empty">{empty}</p>
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ol className="bar-list">
      {rows.map((r, i) => (
        <li key={r.key} className="bar-row" tabIndex={0} style={{ '--i': i } as CSSProperties}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track">
            <span className="bar" style={{ width: `${(Math.max(0, r.value) / max) * 100}%` }} />
            <span className="bar-value">{format(r.value)}</span>
          </span>
          {r.tip && (
            <span className="chart-tip bar-tip" role="tooltip">
              <strong>{format(r.value)}</strong>
              <span className="muted">{r.label}</span>
              {r.tip.map((t) => (
                <span key={t} className="tip-row">
                  {t}
                </span>
              ))}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

/** De-emphasised trend line with the latest point marked. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / span) * 28}`).join(' ')
  const lastTop = ((30 - ((values[values.length - 1] - min) / span) * 28) / 32) * 100
  return (
    <span className="spark" aria-hidden="true">
      <svg viewBox="0 0 100 32" preserveAspectRatio="none">
        <polyline points={pts} />
      </svg>
      <span className="spark-dot" style={{ top: `${lastTop}%` }} />
    </span>
  )
}
