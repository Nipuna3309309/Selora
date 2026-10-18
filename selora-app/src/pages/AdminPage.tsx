import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { CountUp } from '../components/CountUp'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { RestockButton } from '../components/RestockButton'
import { Sheet } from '../components/Sheet'
import type { AdminSection } from '../domain/dashboard'
import { formatLkr } from '../domain/format'
import { latestRestock } from '../domain/restock'
import { nextSku } from '../domain/sku'
import { validateClothing, type ClothingErrors } from '../domain/validation'
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
  suppliers: 'Suppliers',
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
        {section === 'suppliers' && <SuppliersTab />}
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
  const restocks = usePolled(() => service.listRestockRequests(), [service], 15000)
  const lastRestock = useMemo(() => latestRestock(restocks.data), [restocks.data])
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
                <div className="row-actions">
                  {c.stock <= c.lowStockThreshold && (
                    <RestockButton
                      clothingId={c.id}
                      name={c.name}
                      last={lastRestock.get(c.id)}
                      onSent={() => void restocks.reload()}
                    />
                  )}
                  <button className="btn" onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.name}`}>
                    Edit
                  </button>
                </div>
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
          others={(data ?? []).filter((c) => c.id !== editing.id)}
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

/** Number inputs keep an empty box as NaN, so validation can say "Enter a price" instead of saving 0. */
const numberValue = (n: number) => (Number.isNaN(n) ? '' : n)
const readNumber = (v: string) => (v.trim() === '' ? NaN : Number(v))

/** Order the form shows fields in, so Save can focus the first one that needs fixing. */
const FIELD_ORDER: (keyof ClothingErrors)[] = ['name', 'category', 'size', 'sku', 'colour', 'price', 'stock', 'lowStockThreshold']

function ClothingForm({
  initial,
  others,
  stockLocked,
  onCancel,
  onSaved,
}: {
  initial: ClothingInput
  /** Every other item, for duplicate checks and the next SKU number. */
  others: Clothing[]
  stockLocked: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const { service } = useApp()
  const [f, setF] = useState(initial)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<'upload' | 'save' | null>(null)
  // Errors show once a field has been left or Save was pressed, then update as the admin types.
  const [touched, setTouched] = useState<Partial<Record<keyof ClothingErrors, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  // A picked photo waits here until Save, so cancelling never leaves a stray file in the library.
  const [pending, setPending] = useState<{ image: Blob; preview: string } | null>(null)
  const [preparing, setPreparing] = useState(false)
  const set = <K extends keyof ClothingInput>(k: K, v: ClothingInput[K]) => setF((p) => ({ ...p, [k]: v }))
  const touch = (k: keyof ClothingErrors) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

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

  // A new item's SKU is numbered per type when it's saved; this is the number it should get.
  const skuPreview = f.id ? f.sku : nextSku(f.category, others.map((o) => o.sku))
  const errors = useMemo(() => validateClothing(f, others), [f, others])
  const shown = (k: keyof ClothingErrors) => ((submitted || touched[k]) && errors[k]) || undefined
  const errorCount = Object.keys(errors).length

  /** Props that tie an input to its error message. */
  const invalid = (k: keyof ClothingErrors) => ({
    id: `cf-${k}`,
    'aria-invalid': shown(k) ? true : undefined,
    'aria-describedby': shown(k) ? `cf-${k}-error` : undefined,
    onBlur: () => touch(k),
  })
  const message = (k: keyof ClothingErrors) =>
    shown(k) ? (
      <span className="field-error" id={`cf-${k}-error`}>
        <Icon name="alert" size={14} />
        {shown(k)}
      </span>
    ) : null

  const text = (k: 'name' | 'sku', label: string, wide?: boolean) => (
    <label className={wide ? 'field wide' : 'field'}>
      <span>{label}</span>
      <input value={f[k]} maxLength={k === 'name' ? 100 : 30} onChange={(e) => set(k, e.target.value)} {...invalid(k)} />
      {message(k)}
    </label>
  )
  const choice = (k: 'category' | 'size', label: string, options: readonly string[]) => (
    <label className="field">
      <span>{label}</span>
      <select value={f[k]} onChange={(e) => set(k, e.target.value)} {...invalid(k)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {message(k)}
    </label>
  )
  const number = (k: 'price' | 'stock' | 'lowStockThreshold', label: string, opts: { step: number; disabled?: boolean }) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode={opts.step === 1 ? 'numeric' : 'decimal'}
        min={0}
        step={opts.step}
        value={numberValue(f[k])}
        disabled={opts.disabled}
        onChange={(e) => set(k, readNumber(e.target.value))}
        {...invalid(k)}
      />
      {message(k)}
    </label>
  )

  async function save() {
    setError(undefined)
    setSubmitted(true)
    const first = FIELD_ORDER.find((k) => errors[k])
    if (first) {
      document.getElementById(first === 'colour' ? 'cf-colour-name' : `cf-${first}`)?.focus()
      return
    }
    let input = { ...f, name: f.name.trim(), sku: f.sku.trim(), colour: f.colour.trim() }
    try {
      if (pending) {
        setBusy('upload')
        const photoUrl = await service.uploadPhoto(pending.image, skuPreview || input.name)
        input = { ...input, photoUrl }
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
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className="form-grid">
          {text('name', 'Name', true)}
          {choice('category', 'Category', CATEGORIES)}
          {choice('size', 'Size', SIZES)}
          {f.id ? (
            text('sku', 'SKU (must be unique)', true)
          ) : (
            <div className="field wide">
              <span>SKU</span>
              <output className="sku-auto" aria-live="polite">
                {skuPreview}
              </output>
              <span className="muted small">Numbered automatically by type when you save.</span>
            </div>
          )}
          <div className="field wide">
            <span id="cf-colour-label">Colour{f.colour ? `: ${f.colour}` : ''}</span>
            <div className="palette" role="radiogroup" aria-labelledby="cf-colour-label">
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
                  onClick={() => {
                    set('colour', c.name)
                    touch('colour')
                  }}
                />
              ))}
            </div>
            <input
              id="cf-colour-name"
              placeholder="Or type another colour"
              maxLength={40}
              aria-label="Another colour"
              aria-invalid={shown('colour') ? true : undefined}
              aria-describedby={shown('colour') ? 'cf-colour-error' : undefined}
              value={COLOURS.some((c) => c.name === f.colour) ? '' : f.colour}
              onChange={(e) => set('colour', e.target.value)}
              onBlur={() => touch('colour')}
            />
            {message('colour')}
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
                  {pending ? 'Saved to Clothing Photos when you press Save.' : 'JPG, PNG or WebP, up to 20 MB. Large photos are resized.'}
                </p>
              </div>
            </div>
          </div>
          {number('price', 'Price (LKR)', { step: 0.01 })}
          {number('stock', 'Stock', { step: 1, disabled: stockLocked })}
          {number('lowStockThreshold', 'Low-stock level', { step: 1 })}
          <label className="check">
            <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            <span>Customers can buy this</span>
          </label>
        </div>
        {stockLocked && <p className="muted small">Stock is locked while orders are being processed.</p>}
        {submitted && errorCount > 0 && (
          <p className="notice notice-bad" role="alert">
            {errorCount === 1 ? '1 field needs' : `${errorCount} fields need`} fixing before you can save.
          </p>
        )}
        {error && <p className="notice notice-bad" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={!!busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!!busy || preparing}>
            {busy === 'upload' ? 'Uploading photo…' : busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
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

function SuppliersTab() {
  const { service } = useApp()
  const { data, error, reload } = usePolled(() => service.listSuppliers(), [service])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>()

  async function run(key: string, action: () => Promise<string>) {
    setBusy(key)
    setMsg(undefined)
    try {
      setMsg({ text: await action(), bad: false })
      await reload()
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), bad: true })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p className="muted">
        Suppliers get an email when you press Request restock. Each needs an account in your Microsoft 365
        organisation; they don't need to use the app.
      </p>
      <form
        className="supplier-add"
        onSubmit={(e) => {
          e.preventDefault()
          void run('add', async () => {
            const s = await service.addSupplier(email)
            setEmail('')
            return `${s.name} will now get restock emails.`
          })
        }}
      >
        <label className="field">
          Supplier email
          <input
            type="email"
            autoComplete="off"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" disabled={busy !== null || !email.trim()}>
          {busy === 'add' ? 'Adding…' : 'Add supplier'}
        </button>
      </form>
      {msg && (
        <p className={`notice${msg.bad ? ' notice-bad' : ''}`} role={msg.bad ? 'alert' : 'status'}>
          {msg.text}
        </p>
      )}
      {error && <p className="notice notice-bad" role="alert">{error}</p>}
      {data && data.length === 0 ? (
        <div className="empty">
          <p>No suppliers yet. Restock requests aren't emailed to anyone until you add one.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Supplier</th>
              <th scope="col">Email</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id}>
                <td data-label="Supplier">
                  <strong>{s.name}</strong>
                </td>
                <td data-label="Email">{s.email}</td>
                <td>
                  <button
                    className="btn"
                    disabled={busy !== null}
                    aria-label={`Remove ${s.name} as a supplier`}
                    onClick={() =>
                      void run(s.id, async () => {
                        await service.removeSupplier(s.id)
                        return `${s.name} won't get restock emails any more.`
                      })
                    }
                  >
                    {busy === s.id ? 'Removing…' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
