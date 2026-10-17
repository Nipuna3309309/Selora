import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { formatLkr } from '../domain/format'
import { CATEGORIES, SIZES, type Clothing, type ClothingInput } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'
import { OrderList } from './OrdersPage'

type Tab = 'clothes' | 'costs' | 'orders' | 'sales'
const TABS: { id: Tab; label: string }[] = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'costs', label: 'Buying costs' },
  { id: 'orders', label: 'All orders' },
  { id: 'sales', label: 'Sales' },
]

export function AdminPage() {
  const { service } = useApp()
  const [tab, setTab] = useState<Tab>('clothes')
  const orders = usePolled(() => service.listAllOrders(), [service], 3000)
  const inFlight = (orders.data ?? []).filter((o) => o.status === 'Pending' || o.status === 'Processing').length
  const review = (orders.data ?? []).filter((o) => o.status === 'NeedsReview')

  return (
    <section aria-labelledby="admin-title">
      <div className="page-head">
        <h2 id="admin-title">Admin</h2>
      </div>
      {review.length > 0 && (
        <p className="notice notice-warn" role="alert">
          {review.length === 1 ? 'Order' : 'Orders'} {review.map((o) => o.id).join(', ')} {review.length === 1 ? 'needs' : 'need'} review.
          New orders are rejected until {review.length === 1 ? 'it is' : 'they are'} resolved. See docs/recovery.md.
        </p>
      )}
      {inFlight > 0 && (
        <p className="notice">
          {inFlight} {inFlight === 1 ? 'order is' : 'orders are'} being processed. Stock can't be edited until
          {inFlight === 1 ? ' it finishes' : ' they finish'}.
        </p>
      )}
      <div className="segmented" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'clothes' && <ClothesTab stockLocked={inFlight > 0} />}
        {tab === 'costs' && <CostsTab />}
        {tab === 'orders' && (
          <>
            {orders.error && <p className="notice notice-bad" role="alert">{orders.error}</p>}
            <OrderList orders={orders.data ?? []} showCustomer />
          </>
        )}
        {tab === 'sales' && <SalesTab refreshKey={(orders.data ?? []).map((o) => o.status).join()} />}
      </div>
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
  lowStockThreshold: 5,
  isActive: true,
}

function ClothesTab({ stockLocked }: { stockLocked: boolean }) {
  const { service } = useApp()
  const { data, reload, error } = usePolled(() => service.listClothes(), [service], 5000)
  const [editing, setEditing] = useState<ClothingInput | null>(null)
  return (
    <div>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setEditing({ ...BLANK })}>
          Add clothing
        </button>
      </div>
      {error && <p className="notice notice-bad" role="alert">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Details</th>
            <th scope="col">Price</th>
            <th scope="col">Stock</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((c: Clothing) => (
            <tr key={c.id}>
              <td data-label="Item">
                <div className="cell-item">
                  {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span className="thumb-empty" />}
                  <div>
                    <strong>{c.name}</strong>
                    <p className="muted small">{c.sku}</p>
                  </div>
                </div>
              </td>
              <td data-label="Details">
                {c.category}, {c.size}, {c.colour}
              </td>
              <td data-label="Price">{formatLkr(c.price)}</td>
              <td data-label="Stock">
                {c.stock}
                {c.stock === 0 ? (
                  <span className="chip tone-bad">Out of stock</span>
                ) : c.stock <= c.lowStockThreshold ? (
                  <span className="chip tone-warn">Low</span>
                ) : null}
              </td>
              <td data-label="Status">{c.isActive ? 'Active' : 'Hidden from buying'}</td>
              <td>
                <button className="btn" onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.name}`}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data && data.length === 0 && (
        <div className="empty">
          <p>No clothing yet. Add the first piece to start selling.</p>
        </div>
      )}
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
  const text = (k: 'name' | 'sku' | 'photoUrl' | 'colour', label: string, wide?: boolean) => (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} />
    </label>
  )
  const choice = (k: 'category' | 'size', label: string, options: readonly string[]) => (
    <label className="field">
      <span>{label}</span>
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
    <Sheet title={f.id ? 'Edit clothing' : 'Add clothing'} onClose={onCancel} closeDisabled={busy}>
      <div className="form-grid">
        {text('name', 'Name', true)}
        {text('sku', 'SKU (must be unique)', true)}
        {choice('category', 'Category', CATEGORIES)}
        {choice('size', 'Size', SIZES)}
        {text('colour', 'Colour')}
        {text('photoUrl', 'Photo link', true)}
        <label className="field">
          <span>Price (LKR)</span>
          <input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Stock</span>
          <input
            type="number"
            min={0}
            step={1}
            value={f.stock}
            disabled={stockLocked}
            onChange={(e) => set('stock', Number(e.target.value))}
          />
        </label>
        <label className="field">
          <span>Low-stock level</span>
          <input
            type="number"
            min={0}
            step={1}
            value={f.lowStockThreshold}
            onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          <span>Customers can buy this</span>
        </label>
      </div>
      {stockLocked && <p className="muted small">Stock is locked while orders are being processed.</p>}
      {error && <p className="notice notice-bad" role="alert">{error}</p>}
      <div className="sheet-actions">
        <button className="btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Sheet>
  )
}

function CostsTab() {
  const { service } = useApp()
  const clothes = usePolled(() => service.listClothes(), [service])
  const costs = usePolled(() => service.listCosts(), [service], 5000)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>()

  async function save(id: string) {
    try {
      await service.setCurrentCost(id, Number(drafts[id]))
      setMsg({ text: 'Cost saved. Past sales keep the cost recorded when they were made.', bad: false })
      setDrafts((d) => {
        const rest = { ...d }
        delete rest[id]
        return rest
      })
      await costs.reload()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), bad: true })
    }
  }

  return (
    <div>
      <p className="muted">What each piece costs you now. Only new sales use a changed cost.</p>
      {msg && (
        <p className={`notice${msg.bad ? ' notice-bad' : ''}`} role="status">
          {msg.text}
        </p>
      )}
      {costs.error && <p className="notice notice-bad" role="alert">{costs.error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Current cost</th>
            <th scope="col">New cost (LKR)</th>
            <th scope="col"><span className="sr-only">Save</span></th>
          </tr>
        </thead>
        <tbody>
          {(clothes.data ?? []).map((c) => {
            const cur = (costs.data ?? []).find((x) => x.recordKey === `CURRENT-${c.id}`)
            const draft = drafts[c.id] ?? ''
            return (
              <tr key={c.id}>
                <td data-label="Item">
                  <strong>{c.name}</strong>
                  <p className="muted small">
                    {c.size}, {c.colour}
                  </p>
                </td>
                <td data-label="Current cost">
                  {cur ? formatLkr(cur.unitCost) : <span className="tone-warn-text">Not set. Orders for this item are rejected.</span>}
                </td>
                <td data-label="New cost (LKR)">
                  <input
                    className="cost-input"
                    type="number"
                    min={0}
                    aria-label={`New cost for ${c.name}`}
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  />
                </td>
                <td>
                  <button className="btn" disabled={draft === ''} onClick={() => void save(c.id)}>
                    Save cost
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SalesTab({ refreshKey }: { refreshKey: string }) {
  const { service } = useApp()
  const { data, error } = usePolled(() => service.getSalesSummary(), [service, refreshKey])
  if (error) return <p className="notice notice-bad" role="alert">{error}</p>
  if (!data) return <div className="slip slip-skel" aria-busy="true" aria-label="Loading sales" />
  return (
    <div>
      <dl className="ledger">
        <div>
          <dt>Confirmed sales</dt>
          <dd>{formatLkr(data.confirmedRevenue)}</dd>
        </div>
        <div className="less">
          <dt>Cost of goods sold</dt>
          <dd>{formatLkr(data.costOfGoodsSold)}</dd>
        </div>
        <div className="total">
          <dt>Gross profit</dt>
          <dd>{formatLkr(data.grossProfit)}</dd>
        </div>
      </dl>
      <p className="muted">
        {data.unitsSold} {data.unitsSold === 1 ? 'unit' : 'units'} sold across {data.confirmedOrders} confirmed{' '}
        {data.confirmedOrders === 1 ? 'order' : 'orders'}. Gross profit is sales minus the cost recorded at the
        time of each sale. Expenses are not included, so this is not net profit.
      </p>
    </div>
  )
}
