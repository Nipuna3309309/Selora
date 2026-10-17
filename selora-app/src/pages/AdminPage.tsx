import { useState } from 'react'
import { formatLkr } from '../domain/format'
import { CATEGORIES, SIZES, type Clothing, type ClothingInput } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'
import { OrderList } from './OrdersPage'

type Tab = 'clothes' | 'costs' | 'orders' | 'sales'

export function AdminPage() {
  const { service } = useApp()
  const [tab, setTab] = useState<Tab>('clothes')
  const orders = usePolled(() => service.listAllOrders(), [service], 3000)
  const inFlight = (orders.data ?? []).filter(
    (o) => o.status === 'Pending' || o.status === 'Processing',
  ).length
  const review = (orders.data ?? []).filter((o) => o.status === 'NeedsReview')

  return (
    <section>
      <h2>Admin</h2>
      {review.length > 0 && (
        <p className="banner banner-warn" role="alert">
          {review.length} order(s) need review (order {review.map((o) => o.id).join(', ')}). New orders are
          rejected until each is resolved. Follow the recovery procedure in docs/recovery.md.
        </p>
      )}
      {inFlight > 0 && (
        <p className="banner banner-wait">
          {inFlight} order(s) are processing. Stock editing is locked until they finish.
        </p>
      )}
      <div className="tabs" role="tablist">
        {(['clothes', 'costs', 'orders', 'sales'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab on' : 'tab'} onClick={() => setTab(t)}>
            {{ clothes: 'Clothes', costs: 'Buying costs', orders: 'All orders', sales: 'Sales' }[t]}
          </button>
        ))}
      </div>
      {tab === 'clothes' && <ClothesTab stockLocked={inFlight > 0} />}
      {tab === 'costs' && <CostsTab />}
      {tab === 'orders' && <OrderList orders={orders.data ?? []} showCustomer />}
      {tab === 'sales' && <SalesTab refreshKey={(orders.data ?? []).map((o) => o.status).join()} />}
    </section>
  )
}

const BLANK: ClothingInput = {
  name: '',
  sku: '',
  category: 'Other',
  size: 'One Size',
  colour: '',
  photoUrl: '',
  price: 0,
  stock: 0,
  lowStockThreshold: 2,
  isActive: true,
}

function ClothesTab({ stockLocked }: { stockLocked: boolean }) {
  const { service } = useApp()
  const { data, reload, error } = usePolled(() => service.listClothes(), [service], 5000)
  const [editing, setEditing] = useState<ClothingInput | null>(null)
  return (
    <div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" onClick={() => setEditing({ ...BLANK })}>
        Add clothing
      </button>
      <div className="list">
        {(data ?? []).map((c: Clothing) => (
          <article key={c.id} className="row-card">
            <div className="row-head">
              <strong>
                {c.name} <span className="muted">({c.size}, {c.colour})</span>
              </strong>
              <button onClick={() => setEditing({ ...c })}>Edit</button>
            </div>
            <div>
              {formatLkr(c.price)} · stock {c.stock} · low at {c.lowStockThreshold} ·{' '}
              {c.isActive ? 'Active' : 'Inactive'}
              {c.stock === 0 ? (
                <span className="chip chip-bad">Out of stock</span>
              ) : c.stock <= c.lowStockThreshold ? (
                <span className="chip chip-warn">Low stock</span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <ClothingForm
          initial={editing}
          stockLocked={stockLocked}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
          }}
        />
      )}
    </div>
  )
}

function ClothingForm({
  initial,
  stockLocked,
  onCancel,
  onSaved,
}: {
  initial: ClothingInput
  stockLocked: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const { service } = useApp()
  const [f, setF] = useState(initial)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof ClothingInput>(k: K, v: ClothingInput[K]) => setF((p) => ({ ...p, [k]: v }))
  const text = (k: 'name' | 'sku' | 'photoUrl' | 'colour', label: string) => (
    <label>
      {label}
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} />
    </label>
  )
  const choice = (k: 'category' | 'size', label: string, options: readonly string[]) => (
    <label>
      {label}
      <select value={f[k]} onChange={(e) => set(k, e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  )
  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await service.saveClothing(f)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Edit clothing">
      <div className="dialog">
        <h2>{f.id ? 'Edit clothing' : 'Add clothing'}</h2>
        <div className="form">
          {text('name', 'Name')}
          {text('sku', 'SKU (unique)')}
          {choice('category', 'Category', CATEGORIES)}
          {choice('size', 'Size', SIZES)}
          {text('colour', 'Colour')}
          {text('photoUrl', 'Photo URL')}
          <label>
            Price (LKR)
            <input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value))} />
          </label>
          <label>
            Stock
            <input
              type="number"
              min={0}
              step={1}
              value={f.stock}
              disabled={stockLocked}
              onChange={(e) => set('stock', Number(e.target.value))}
            />
          </label>
          <label>
            Low-stock threshold
            <input type="number" min={0} step={1} value={f.lowStockThreshold} onChange={(e) => set('lowStockThreshold', Number(e.target.value))} />
          </label>
          <label className="radio">
            <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active (can be bought)
          </label>
        </div>
        {stockLocked && <p className="muted">Stock is locked while orders are processing.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="primary" onClick={() => void save()} disabled={busy}>Save</button>
        </div>
      </div>
    </div>
  )
}

function CostsTab() {
  const { service } = useApp()
  const clothes = usePolled(() => service.listClothes(), [service])
  const costs = usePolled(() => service.listCosts(), [service], 5000)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string>()

  async function save(id: string) {
    try {
      await service.setCurrentCost(id, Number(drafts[id]))
      setMsg('Cost saved. Past sales keep the cost recorded when they were made.')
      setDrafts((d) => {
        const { [id]: _removed, ...rest } = d
        void _removed
        return rest
      })
      await costs.reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <p className="muted">Current buying cost per unit. Only new sales use a changed cost.</p>
      {msg && <p role="status">{msg}</p>}
      {costs.error && <p className="error" role="alert">{costs.error}</p>}
      <div className="list">
        {(clothes.data ?? []).map((c) => {
          const cur = (costs.data ?? []).find((x) => x.recordKey === `CURRENT-${c.id}`)
          return (
            <article key={c.id} className="row-card row-head">
              <span>
                {c.name} <span className="muted">({c.size}, {c.colour})</span>
                <br />
                <span className="muted">{cur ? `Current: ${formatLkr(cur.unitCost)}` : 'No cost set: orders for this item are rejected'}</span>
              </span>
              <span className="inline">
                <input
                  type="number"
                  min={0}
                  aria-label={`New cost for ${c.name}`}
                  value={drafts[c.id] ?? ''}
                  placeholder="New cost"
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                />
                <button disabled={drafts[c.id] === undefined || drafts[c.id] === ''} onClick={() => void save(c.id)}>
                  Save
                </button>
              </span>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function SalesTab({ refreshKey }: { refreshKey: string }) {
  const { service } = useApp()
  const { data, error } = usePolled(() => service.getSalesSummary(), [service, refreshKey])
  if (error) return <p className="error" role="alert">{error}</p>
  if (!data) return <p className="muted">Loading…</p>
  return (
    <div>
      <div className="stats">
        <Stat label="Confirmed sales revenue" value={formatLkr(data.confirmedRevenue)} />
        <Stat label="Units sold" value={String(data.unitsSold)} />
        <Stat label="Cost of goods sold" value={formatLkr(data.costOfGoodsSold)} />
        <Stat label="Gross profit" value={formatLkr(data.grossProfit)} />
      </div>
      <p className="muted">
        Gross profit = confirmed sales revenue − cost recorded at the time of each sale. Expenses are not
        included, so this is not net profit. Based on {data.confirmedOrders} confirmed order(s).
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
