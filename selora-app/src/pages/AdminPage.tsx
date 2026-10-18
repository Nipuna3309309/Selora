import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react'
import { CountUp } from '../components/CountUp'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { Sheet } from '../components/Sheet'
import type { AdminSection } from '../domain/dashboard'
import { formatLkr } from '../domain/format'
import { CATEGORIES, COLOURS, SIZES, type Clothing, type ClothingInput } from '../domain/types'
import { useApp } from '../context'
import { prepareImage } from '../photoFile'
import { usePolled } from '../usePolled'
import { OrderList } from './OrdersPage'

const ADMIN_TITLES: Record<AdminSection, string> = {
  clothes: 'Clothes',
  costs: 'Buying costs',
  'all-orders': 'All orders',
  sales: 'Sales',
}

/** One admin section, chosen in the sidebar. */
export function AdminPage({ section }: { section: AdminSection }) {
  const { service } = useApp()
  const orders = usePolled(() => service.listAllOrders(), [service], 3000)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])
  const inFlight = (orders.data ?? []).filter((o) => o.status === 'Pending' || o.status === 'Processing').length
  // Stock is only held while the flow is actually working. A Pending order that has sat for
  // over two minutes means the flow isn't running, so it must not lock stock forever.
  const working = (orders.data ?? []).filter(
    (o) => o.status === 'Processing' || (o.status === 'Pending' && now - new Date(o.createdAt).getTime() < 120_000),
  ).length
  const review = (orders.data ?? []).filter((o) => o.status === 'NeedsReview')

  return (
    <section aria-labelledby="admin-title">
      <div className="page-head">
        <h2 id="admin-title">{ADMIN_TITLES[section]}</h2>
      </div>
      {review.length > 0 && (
        <p className="notice notice-warn" role="alert">
          {review.length === 1 ? 'Order' : 'Orders'} {review.map((o) => o.id).join(', ')} {review.length === 1 ? 'needs' : 'need'} review.
          New orders are rejected until {review.length === 1 ? 'it is' : 'they are'} resolved. See docs/recovery.md.
        </p>
      )}
      {working > 0 && (
        <p className="notice">
          {working} {working === 1 ? 'order is' : 'orders are'} being processed. Stock can't be edited until
          {working === 1 ? ' it finishes' : ' they finish'}.
        </p>
      )}
      {inFlight > working && (
        <p className="notice notice-warn">
          {inFlight - working} {inFlight - working === 1 ? 'order has' : 'orders have'} been Pending for over 2 minutes, so the
          Power Automate flow doesn't seem to be running.
        </p>
      )}
      <div className="section-body">
        {section === 'clothes' && <ClothesTab stockLocked={working > 0} />}
        {section === 'costs' && <CostsTab />}
        {section === 'all-orders' && (
          <>
            {orders.error && <p className="notice notice-bad" role="alert">{orders.error}</p>}
            <OrderList orders={orders.data ?? []} showCustomer />
          </>
        )}
        {section === 'sales' && <SalesTab refreshKey={(orders.data ?? []).map((o) => o.status).join()} />}
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
                  <span className="thumb">{c.photoUrl ? <Photo url={c.photoUrl} alt="" /> : null}</span>
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
  const [busy, setBusy] = useState<'upload' | 'save' | null>(null)
  // A picked photo waits here until Save, so cancelling never leaves a stray file in the library.
  const [pending, setPending] = useState<{ image: Blob; preview: string } | null>(null)
  const [preparing, setPreparing] = useState(false)
  const set = <K extends keyof ClothingInput>(k: K, v: ClothingInput[K]) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.preview)
  }, [pending])

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(undefined)
    setPreparing(true)
    try {
      const image = await prepareImage(file)
      setPending({ image, preview: URL.createObjectURL(image) })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPreparing(false)
    }
  }

  const text = (k: 'name' | 'sku', label: string, wide?: boolean) => (
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
    setError(undefined)
    let input = f
    try {
      if (pending) {
        setBusy('upload')
        const photoUrl = await service.uploadPhoto(pending.image, f.sku || f.name)
        input = { ...f, photoUrl }
        // Keep the uploaded link, so retrying after a failed save doesn't upload the photo again.
        setF(input)
        setPending(null)
      }
      setBusy('save')
      await service.saveClothing(input)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }
  return (
    <Sheet title={f.id ? 'Edit clothing' : 'Add clothing'} onClose={onCancel} closeDisabled={!!busy}>
      <div className="form-grid">
        {text('name', 'Name', true)}
        {text('sku', 'SKU (must be unique)', true)}
        {choice('category', 'Category', CATEGORIES)}
        {choice('size', 'Size', SIZES)}
        <div className="field wide">
          <span>Colour{f.colour ? `: ${f.colour}` : ''}</span>
          <div className="palette" role="radiogroup" aria-label="Colour">
            {COLOURS.map((c) => (
              <button
                key={c.name}
                type="button"
                role="radio"
                aria-checked={f.colour === c.name}
                aria-label={c.name}
                title={c.name}
                className="swatch"
                style={{ '--sw': c.hex } as CSSProperties}
                onClick={() => set('colour', c.name)}
              />
            ))}
          </div>
          <input
            placeholder="Or type another colour"
            value={COLOURS.some((c) => c.name === f.colour) ? '' : f.colour}
            onChange={(e) => set('colour', e.target.value)}
          />
        </div>
        <div className="field wide">
          <span>Photo</span>
          <div className="photo-picker">
            <div className="picker-preview">
              {pending ? (
                <img src={pending.preview} alt="New photo, not saved yet" />
              ) : f.photoUrl ? (
                <Photo url={f.photoUrl} alt="Current photo" saveAs={f.name || 'photo'} />
              ) : (
                <span className="picker-empty">
                  <Icon name="image" size={28} />
                </span>
              )}
            </div>
            <div className="picker-actions">
              <label className={`btn btn-file${busy || preparing ? ' is-disabled' : ''}`}>
                <input type="file" accept="image/*" className="sr-only" disabled={!!busy || preparing} onChange={(e) => void pick(e)} />
                <Icon name="image" size={18} />
                {preparing ? 'Preparing…' : pending || f.photoUrl ? 'Replace photo' : 'Upload photo'}
              </label>
              {(pending || f.photoUrl) && (
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!!busy}
                  onClick={() => {
                    setPending(null)
                    set('photoUrl', '')
                  }}
                >
                  Remove photo
                </button>
              )}
              <p className="muted small">
                {pending ? 'Saved to Clothing Photos when you press Save.' : 'JPG, PNG or WebP. Large photos are resized.'}
              </p>
            </div>
          </div>
        </div>
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
        <button className="btn" onClick={onCancel} disabled={!!busy}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => void save()} disabled={!!busy || preparing}>
          {busy === 'upload' ? 'Uploading photo…' : busy === 'save' ? 'Saving…' : 'Save changes'}
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
          <dd><CountUp value={data.confirmedRevenue} format={formatLkr} /></dd>
        </div>
        <div className="less">
          <dt>Cost of goods sold</dt>
          <dd><CountUp value={data.costOfGoodsSold} format={formatLkr} /></dd>
        </div>
        <div className="total">
          <dt>Gross profit</dt>
          <dd><CountUp value={data.grossProfit} format={formatLkr} /></dd>
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
