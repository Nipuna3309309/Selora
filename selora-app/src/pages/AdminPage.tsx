import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { RestockButton } from '../components/RestockButton'
import { Sheet } from '../components/Sheet'
import type { AdminSection } from '../domain/dashboard'
import { formatLkr, newId } from '../domain/format'
import {
  afterPurchase,
  describeRule,
  outOfDatePrices,
  priceFromCost,
  ROUND_OPTIONS,
  rulePrice,
  rulesFrom,
  validateRule,
  type PriceChange,
  type ProfitRule,
  type RuleErrors,
} from '../domain/pricing'
import { latestRestock, openDeliveries, type Delivery } from '../domain/restock'
import { StockSavedError, type ShopService } from '../services/ShopService'
import { COUNTER_NOTE_MAX, offerPurchaseId, validateCounter, type SupplierOffer } from '../domain/supplier'
import { nextSku } from '../domain/sku'
import { validateClothing, type ClothingErrors } from '../domain/validation'
import { CATEGORIES, COLOURS, SIZES, type Clothing, type ClothingCost, type ClothingInput } from '../domain/types'
import { useApp } from '../context'
import { prepareImage } from '../photoFile'
import { usePolled } from '../usePolled'
import { OrderList } from './OrdersPage'
import { SalesPage } from './SalesPage'

const ADMIN_TITLES: Record<AdminSection, string> = {
  clothes: 'Clothes',
  pricing: 'Profit rules',
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
  // One entry per Orders row: every item of an interrupted order is marked NeedsReview.
  const review = [...new Set((orders.data ?? []).filter((o) => o.status === 'NeedsReview').map((o) => o.parentId))]

  return (
    <section aria-labelledby="admin-title">
      <div className="page-head">
        <h2 id="admin-title">{ADMIN_TITLES[section]}</h2>
      </div>
      {review.length > 0 && (
        <p className="notice notice-warn" role="alert">
          {review.length === 1 ? 'Order' : 'Orders'} {review.join(', ')} {review.length === 1 ? 'needs' : 'need'} review.
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
        {section === 'pricing' && <PricingTab />}
        {section === 'all-orders' && (
          <>
            {orders.error && <p className="notice notice-bad" role="alert">{orders.error}</p>}
            <OrderList orders={orders.data ?? []} showCustomer />
          </>
        )}
        {section === 'suppliers' && <SuppliersTab />}
        {section === 'sales' && <SalesPage refreshKey={(orders.data ?? []).map((o) => o.status).join()} />}
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
  autoPrice: true,
}

function ClothesTab({ stockLocked }: { stockLocked: boolean }) {
  const { service } = useApp()
  const { data, reload, error } = usePolled(() => service.listClothes(), [service], 5000)
  const restocks = usePolled(() => service.listRestockRequests(), [service], 15000)
  const costs = usePolled(() => service.listCosts(), [service], 15000)
  const lastRestock = useMemo(() => latestRestock(restocks.data), [restocks.data])
  const pricing = usePricing(costs.data)
  const deliveries = useMemo(
    () => (restocks.data && costs.data ? openDeliveries(restocks.data, costs.data) : []),
    [restocks.data, costs.data],
  )
  const [editing, setEditing] = useState<ClothingInput | null>(null)
  const [buying, setBuying] = useState<{ item: Clothing; delivery?: Delivery; offer?: SupplierOffer } | null>(null)
  const problem = error ?? costs.error
  const refresh = () => {
    void reload()
    void costs.reload()
    void restocks.reload()
  }
  return (
    <div>
      <div className="toolbar">
        <button className="btn btn-primary" disabled={!costs.data} onClick={() => setEditing({ ...BLANK })}>
          Add clothing
        </button>
      </div>
      {problem && <p className="notice notice-bad" role="alert">{problem}</p>}
      <Deliveries
        deliveries={deliveries}
        clothes={data ?? []}
        pricing={pricing}
        stockLocked={stockLocked}
        onChange={(item, delivery, offer) => setBuying({ item, delivery, offer })}
        onDone={refresh}
      />
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
              <td data-label="Price">
                {formatLkr(c.price)}
                {costs.data && <PriceLine item={c} pricing={pricing} />}
              </td>
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
                  <button
                    className="btn"
                    disabled={stockLocked || !costs.data}
                    title={stockLocked ? 'Stock is locked while orders are being processed.' : undefined}
                    onClick={() => setBuying({ item: c })}
                    aria-label={`Buy stock of ${c.name}`}
                  >
                    Buy stock
                  </button>
                  <button
                    className="btn"
                    disabled={!costs.data}
                    onClick={() => setEditing({ ...c })}
                    aria-label={`Edit ${c.name}`}
                  >
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
          currentCost={editing.id ? pricing.cost.get(editing.id) : undefined}
          rules={pricing.rules}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void reload()
            void costs.reload()
          }}
        />
      )}
      {buying && (
        <BuyStockSheet
          item={buying.item}
          currentCost={pricing.cost.get(buying.item.id)}
          lastCost={pricing.lastCost.get(buying.item.id)}
          rule={pricing.rules.get(buying.item.category)}
          delivery={buying.delivery}
          offer={buying.offer}
          onCancel={() => setBuying(null)}
          onDone={() => {
            setBuying(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

/** Number inputs keep an empty box as NaN, so validation can say "Enter a price" instead of saving 0. */
const numberValue = (n: number) => (Number.isNaN(n) ? '' : n)
const readNumber = (v: string) => (v.trim() === '' ? NaN : Number(v))

type FormKey = keyof ClothingErrors | 'cost'
type FormErrors = Partial<Record<FormKey, string>>

/** Order the form shows fields in, so Save can focus the first one that needs fixing. */
const FIELD_ORDER: FormKey[] = ['name', 'category', 'size', 'sku', 'colour', 'cost', 'price', 'stock', 'lowStockThreshold']

function costError(cost: number): string | undefined {
  if (Number.isNaN(cost)) return 'Enter what each piece cost you.'
  if (cost < 0) return 'Cost must be 0 or more.'
  if (cost > 1_000_000) return 'That cost looks too high. Check the number.'
  if (Math.abs(Math.round(cost * 100) - cost * 100) > 1e-6) return 'Use at most 2 decimal places.'
}

/**
 * From the ClothingCosts rows: each item's current (average) cost, what it cost on its latest
 * purchase (the best guess for the next one), and the profit rule per category.
 */
function usePricing(costs: ClothingCost[] | undefined) {
  return useMemo(() => {
    const rows = costs ?? []
    const lastCost = new Map<string, number>()
    for (const p of rows.filter((c) => c.costType === 'Purchase').sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
      lastCost.set(p.clothingId, p.unitCost)
    return {
      cost: new Map(rows.filter((c) => c.costType === 'CurrentCost').map((c) => [c.clothingId, c.unitCost])),
      lastCost,
      rules: rulesFrom(rows),
    }
  }, [costs])
}

type Pricing = ReturnType<typeof usePricing>

/** "Cost LKR 1,000 · profit LKR 400 (40%) · Auto", for the Clothes table. */
function PriceLine({ item, pricing }: { item: Clothing; pricing: Pricing }) {
  const cost = pricing.cost.get(item.id)
  const mode = item.autoPrice ? 'Auto' : 'Fixed'
  if (cost === undefined) return <p className="muted small">No cost set · {mode}</p>
  const profit = item.price - cost
  return (
    <p className={`small ${profit <= 0 ? 'tone-warn-text' : 'muted'}`}>
      Cost {formatLkr(cost)} · profit {formatLkr(profit)}
      {cost > 0 ? ` (${Math.round((profit / cost) * 100)}%)` : ''} · {mode}
    </p>
  )
}

/** What Auto or Fixed means for this item right now. */
function PriceModeHint({ category, auto, rule, cost }: { category: string; auto: boolean; rule?: ProfitRule; cost?: number }) {
  const target = rule && cost !== undefined ? priceFromCost(cost, rule) : undefined
  if (!auto)
    return (
      <p className="muted small">
        Fixed price: it stays as you set it.
        {target !== undefined && <> The {category} rule would give {formatLkr(target)}.</>}
      </p>
    )
  if (!rule)
    return (
      <p className="muted small">
        No {category} profit rule yet, so type a price for now. It follows the rule once you set one in Profit rules.
      </p>
    )
  if (target === undefined) return <p className="muted small">{category} profit is {describeRule(rule)}. Enter the cost to work out the price.</p>
  return (
    <p className="muted small">
      Cost + {describeRule(rule)} = <strong>{formatLkr(target)}</strong>. It updates by itself when the cost or the rule changes.
    </p>
  )
}

function LossWarning({ cost, price }: { cost: number; price: number }) {
  if (Number.isNaN(cost) || !(price > 0) || price > cost) return null
  return <p className="tone-warn-text small">This price doesn't cover the cost, so every sale loses money.</p>
}

function ClothingForm({
  initial,
  others,
  stockLocked,
  currentCost,
  rules,
  onCancel,
  onSaved,
}: {
  initial: ClothingInput
  /** Every other item, for duplicate checks and the next SKU number. */
  others: Clothing[]
  stockLocked: boolean
  currentCost?: number
  rules: Map<string, ProfitRule>
  onCancel: () => void
  onSaved: () => void
}) {
  const { service } = useApp()
  const isNew = !initial.id
  const [f, setF] = useState(initial)
  const [cost, setCost] = useState(currentCost ?? NaN)
  // Set once a new item exists, so a retry after a later step fails doesn't add it twice.
  const [created, setCreated] = useState<Clothing | null>(null)
  const [purchaseId] = useState(() => newId('P'))
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<'upload' | 'save' | null>(null)
  // Errors show once a field has been left or Save was pressed, then update as the admin types.
  const [touched, setTouched] = useState<Partial<Record<FormKey, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  // A picked photo waits here until Save, so cancelling never leaves a stray file in the library.
  const [pending, setPending] = useState<{ image: Blob; preview: string } | null>(null)
  const [preparing, setPreparing] = useState(false)
  const set = <K extends keyof ClothingInput>(k: K, v: ClothingInput[K]) => setF((p) => ({ ...p, [k]: v }))
  const touch = (k: FormKey) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  const rule = rules.get(f.category)
  const validCost = costError(cost) ? undefined : cost
  // An Auto item shows, and saves, the price its rule gives; until that can be worked out, the typed one.
  const ruled = rulePrice(f, validCost, rule)
  const form = useMemo(() => ({ ...f, price: ruled ?? f.price }), [f, ruled])

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
  const errors = useMemo(() => {
    const e: FormErrors = validateClothing(form, others)
    // A new item needs its cost; on an edit an empty box leaves the cost as it is.
    const c = isNew || !Number.isNaN(cost) ? costError(cost) : undefined
    if (c) e.cost = c
    return e
  }, [form, others, cost, isNew])
  const shown = (k: FormKey) => ((submitted || touched[k]) && errors[k]) || undefined
  const errorCount = Object.keys(errors).length

  /** Props that tie an input to its error message. */
  const invalid = (k: FormKey) => ({
    id: `cf-${k}`,
    'aria-invalid': shown(k) ? true : undefined,
    'aria-describedby': shown(k) ? `cf-${k}-error` : undefined,
    onBlur: () => touch(k),
  })
  const message = (k: FormKey) =>
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
        value={numberValue(form[k])}
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
    let input = { ...form, name: f.name.trim(), sku: f.sku.trim(), colour: f.colour.trim() }
    try {
      if (pending && !created) {
        setBusy('upload')
        const photoUrl = await service.uploadPhoto(pending.image, skuPreview || input.name)
        input = { ...input, photoUrl }
        // Keep the uploaded link, so retrying after a failed save doesn't upload the photo again.
        setF(input)
        setPending(null)
      }
      setBusy('save')
      if (!isNew) {
        await service.saveClothing(input)
        if (!Number.isNaN(cost) && cost !== currentCost) await service.setCurrentCost(input.id!, cost)
      } else {
        // The item, then its cost (orders are rejected without one), then the purchase for the dashboard.
        const item = created ?? (await service.saveClothing(input))
        setCreated(item)
        await service.setCurrentCost(item.id, cost)
        if (item.stock > 0) {
          await service.recordPurchase({ purchaseId, clothingId: item.id, quantity: item.stock, unitCost: cost })
        }
      }
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
          <label className="field">
            <span>Cost per piece (LKR)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={numberValue(cost)}
              placeholder={isNew ? undefined : 'Not set'}
              onChange={(e) => setCost(readNumber(e.target.value))}
              {...invalid('cost')}
            />
            {message('cost')}
            {!isNew && <span className="muted small">Average over your stock. Buy stock updates it; change it here only to fix a mistake.</span>}
          </label>
          {number('price', 'Selling price (LKR)', { step: 0.01, disabled: ruled !== undefined })}
          <div className="field wide price-hint">
            <label className="check">
              <input
                type="checkbox"
                checked={f.autoPrice}
                // Switching to Fixed starts from the price shown, so nothing jumps.
                onChange={(e) => setF((p) => ({ ...p, autoPrice: e.target.checked, price: form.price }))}
              />
              <span>Auto price: follow the {f.category} profit rule</span>
            </label>
            <PriceModeHint category={f.category} auto={f.autoPrice} rule={rule} cost={validCost} />
            <LossWarning cost={cost} price={form.price} />
          </div>
          {number('stock', isNew ? 'Quantity bought' : 'Stock', { step: 1, disabled: stockLocked })}
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
            {busy === 'upload' ? 'Uploading photo…' : busy === 'save' ? 'Saving…' : isNew ? 'Add to shop' : 'Save changes'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

type BuyKey = 'quantity' | 'cost'

interface Receipt {
  item: Clothing
  quantity: number
  /** What each of the new pieces cost. */
  unitCost: number
  purchaseId: string
  /** Restock requests this purchase answers; closed at the end. */
  requestIds?: string[]
}

/**
 * Receiving stock: the stock, average cost and Auto price in one step (worked out from fresh data
 * by addStock), then the purchase log and closing the restock requests. Pass `stockAdded` on a
 * retry after the stock went in, so it isn't added twice.
 */
async function receiveStock(service: ShopService, r: Receipt, stockAdded: boolean, onStockAdded: () => void) {
  if (!stockAdded) {
    try {
      await service.addStock(r.item.id, r.quantity, r.unitCost)
    } catch (e) {
      if (e instanceof StockSavedError) onStockAdded()
      throw e
    }
    onStockAdded()
  }
  await service.recordPurchase({ purchaseId: r.purchaseId, clothingId: r.item.id, quantity: r.quantity, unitCost: r.unitCost })
  if (r.requestIds?.length) await service.closeRestockRequests(r.requestIds)
}

/** "price LKR 1,300 → LKR 1,400", "price stays LKR 1,300" or "fixed price stays LKR 1,300". */
function PriceAfter({ item, price }: { item: Clothing; price: number }) {
  if (price !== item.price)
    return (
      <>
        price {formatLkr(item.price)} → <strong>{formatLkr(price)}</strong>
      </>
    )
  return <>{item.autoPrice ? 'price stays' : 'fixed price stays'} {formatLkr(price)}</>
}

const askedDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/** Stock asked for from suppliers. When it arrives, Received adds it at the cost and price shown. */
function Deliveries({
  deliveries,
  clothes,
  pricing,
  stockLocked,
  onChange,
  onDone,
}: {
  deliveries: Delivery[]
  clothes: Clothing[]
  pricing: Pricing
  stockLocked: boolean
  onChange: (item: Clothing, d: Delivery, offer?: SupplierOffer) => void
  onDone: () => void
}) {
  const rows = deliveries.flatMap((d) => {
    const item = clothes.find((c) => c.id === d.clothingId)
    return item ? [{ d, item }] : []
  })
  if (rows.length === 0) return null
  return (
    <section className="card deliveries" aria-labelledby="deliveries-title">
      <header className="card-head">
        <div>
          <h3 id="deliveries-title">Deliveries due</h3>
          <p className="muted small">Restock you asked suppliers for, with their offers. Press Received when it arrives.</p>
        </div>
      </header>
      <ul className="delivery-list">
        {rows.map(({ d, item }) => (
          <DeliveryRow
            key={item.id}
            d={d}
            item={item}
            currentCost={pricing.cost.get(item.id)}
            unitCost={pricing.lastCost.get(item.id) ?? pricing.cost.get(item.id)}
            rule={pricing.rules.get(item.category)}
            stockLocked={stockLocked}
            onChange={(offer) => onChange(item, d, offer)}
            onDone={onDone}
          />
        ))}
      </ul>
    </section>
  )
}

function DeliveryRow({
  d,
  item,
  currentCost,
  unitCost,
  rule,
  stockLocked,
  onChange,
  onDone,
}: {
  d: Delivery
  item: Clothing
  currentCost?: number
  /** Expected cost per piece without an offer: what the last purchase cost. */
  unitCost?: number
  rule?: ProfitRule
  stockLocked: boolean
  /** Opens Buy stock for this delivery, filled from the offer when one is given. */
  onChange: (offer?: SupplierOffer) => void
  onDone: () => void
}) {
  const { service } = useApp()
  const [ownPurchaseId] = useState(() => newId('P'))
  // The purchase whose stock already went in, so a retry only finishes that one.
  const [stockAddedFor, setStockAddedFor] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const locked = busy !== null || stockLocked
  const [negotiating, setNegotiating] = useState<SupplierOffer | null>(null)

  /** Receives stock: from a supplier's offer, or at the expected quantity and cost. */
  async function receive(key: string, quantity: number, cost: number, purchaseId: string) {
    setBusy(key)
    setError(undefined)
    try {
      await receiveStock(
        service,
        { item, quantity, unitCost: cost, purchaseId, requestIds: d.requestIds },
        stockAddedFor === purchaseId,
        () => setStockAddedFor(purchaseId),
      )
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  async function notComing() {
    setBusy('cancel')
    setError(undefined)
    try {
      await service.closeRestockRequests(d.requestIds)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(null)
    }
  }

  // Without offers, one click needs a quantity and a cost; otherwise Received opens the sheet.
  const ready = d.quantity !== undefined && unitCost !== undefined
  const after = ready ? afterPurchase(item, currentCost, rule, d.quantity!, unitCost!) : undefined
  const receivedButton = (key: string, label: string, onClick: () => void, primary = true) => (
    <button
      className={`btn btn-small${primary ? ' btn-primary' : ''}`}
      disabled={locked || (stockAddedFor !== null && busy === null && key !== stockAddedFor)}
      title={stockLocked ? 'Stock is locked while orders are being processed.' : undefined}
      onClick={onClick}
    >
      <Icon name="check" size={16} />
      {busy === key ? 'Adding…' : label}
    </button>
  )

  return (
    <li className="delivery">
      <span className="thumb">{item.photoUrl ? <Photo url={item.photoUrl} alt="" /> : null}</span>
      <div className="delivery-text">
        <strong>{item.name}</strong>
        <p className="muted small">
          {item.size}, {item.colour} · asked {askedDay(d.askedAt)} · {item.stock} in stock
        </p>
        {d.offers.length > 0 ? (
          <ul className="offer-lines">
            {d.offers.map((o) => {
              const pid = offerPurchaseId(o.id)
              const a = afterPurchase(item, currentCost, rule, o.quantity, o.unitCost)
              return (
                <li key={o.id}>
                  <p className="small">
                    <strong>{o.supplierName}</strong> offers {o.quantity} × {formatLkr(o.unitCost)}
                    {o.arriveBy && <>, arriving {askedDay(`${o.arriveBy}T00:00:00`)}</>} · <PriceAfter item={item} price={a.price} />
                    {o.note && <span className="muted"> · “{o.note}”</span>}
                  </p>
                  {o.counter && (
                    <p className="small">
                      <span className="chip tone-wait">Your counter</span> {o.counter.quantity} × {formatLkr(o.counter.unitCost)}
                      {o.counter.note && <span className="muted"> · “{o.counter.note}”</span>}
                      <span className="muted"> · waiting for {o.supplierName}</span>
                    </p>
                  )}
                  <div className="row-actions">
                    {receivedButton(pid, stockAddedFor === pid ? 'Try again' : 'Received', () =>
                      void receive(pid, o.quantity, o.unitCost, pid),
                    )}
                    {stockAddedFor === null && (
                      <button className="btn btn-small" disabled={locked} onClick={() => setNegotiating(o)}>
                        {o.counter ? 'Change counter…' : 'Negotiate…'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="small">
            {after ? (
              <>
                {d.quantity} × {formatLkr(unitCost!)} · <PriceAfter item={item} price={after.price} />
                <span className="muted"> · no supplier offer yet</span>
              </>
            ) : (
              <span className="muted">{d.quantity === undefined ? 'Quantity not known yet.' : 'No cost known yet.'}</span>
            )}
          </p>
        )}
        {error && <p className="restock-error" role="alert">{error}</p>}
      </div>
      {negotiating && (
        <CounterSheet
          offer={negotiating}
          item={item}
          onCancel={() => setNegotiating(null)}
          onDone={() => {
            setNegotiating(null)
            onDone()
          }}
        />
      )}
      <div className="row-actions">
        {d.offers.length === 0 &&
          receivedButton(ownPurchaseId, stockAddedFor === ownPurchaseId ? 'Try again' : ready ? 'Received' : 'Received…', () =>
            ready ? void receive(ownPurchaseId, d.quantity!, unitCost!, ownPurchaseId) : onChange(),
          )}
        {d.offers.length === 0 && ready && stockAddedFor === null && (
          <button className="btn btn-small" disabled={locked} onClick={() => onChange()}>
            Change…
          </button>
        )}
        {stockAddedFor === null && (
          <button className="ghost-btn" disabled={busy !== null} onClick={() => void notComing()}>
            {busy === 'cancel' ? 'Removing…' : 'Not coming'}
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * Negotiating a supplier's offer. The offer itself is the supplier's and can't be edited here: the
 * shop proposes a quantity and price, and the supplier answers by changing their offer.
 */
function CounterSheet({ offer, item, onCancel, onDone }: { offer: SupplierOffer; item: Clothing; onCancel: () => void; onDone: () => void }) {
  const { service } = useApp()
  const start = offer.counter ?? offer
  const [quantity, setQuantity] = useState(start.quantity)
  const [unitCost, setUnitCost] = useState(start.unitCost)
  const [note, setNote] = useState(offer.counter?.note ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const errors = validateCounter({ quantity, unitCost, note })
  const unchanged = quantity === offer.quantity && unitCost === offer.unitCost && !note.trim()
  const read = (v: string) => (v.trim() === '' ? NaN : Number(v))
  const err = (m?: string) =>
    submitted && m ? (
      <span className="field-error">
        <Icon name="alert" size={14} />
        {m}
      </span>
    ) : null

  async function send() {
    setSubmitted(true)
    setError(undefined)
    if (Object.keys(errors).length) return
    setBusy(true)
    try {
      await service.counterOffer(offer.id, { quantity, unitCost, note: note.trim() })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={`Negotiate: ${item.name}`} onClose={onCancel} closeDisabled={busy}>
      <p className="notice">
        {offer.supplierName} offered {offer.quantity} × {formatLkr(offer.unitCost)}. You can't change their offer, but you can ask
        for different terms. They will see your counter and send a new offer.
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <div className="form-grid">
          <label className="field">
            <span>Pieces you want</span>
            <input type="number" inputMode="numeric" min={1} step={1} value={Number.isNaN(quantity) ? '' : quantity} disabled={busy}
              onChange={(e) => setQuantity(read(e.target.value))} />
            {err(errors.quantity)}
          </label>
          <label className="field">
            <span>Price per piece you ask (LKR)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={Number.isNaN(unitCost) ? '' : unitCost} disabled={busy}
              onChange={(e) => setUnitCost(read(e.target.value))} />
            {err(errors.unitCost)}
          </label>
          <label className="field wide">
            <span>Message to the supplier (optional)</span>
            <input maxLength={COUNTER_NOTE_MAX} value={note} disabled={busy} placeholder="e.g. Can you do a lower price?"
              onChange={(e) => setNote(e.target.value)} />
            {err(errors.note)}
          </label>
        </div>
        {error && <p className="notice notice-bad" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || unchanged}>
            {busy ? 'Sending…' : 'Send counter'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

/**
 * Buying more of an item: quantity and cost per piece go in. The sheet shows the new average cost
 * and, for an Auto item, the price its rule gives; a Fixed item keeps its price.
 */
function BuyStockSheet({
  item,
  currentCost,
  lastCost,
  rule,
  delivery,
  offer,
  onCancel,
  onDone,
}: {
  item: Clothing
  currentCost?: number
  /** What the last purchase cost per piece, to start the cost box from. */
  lastCost?: number
  rule?: ProfitRule
  /** Set when this purchase is a delivery the suppliers were asked for. */
  delivery?: Delivery
  /** The supplier offer being received, if any: it fills the quantity and cost. */
  offer?: SupplierOffer
  onCancel: () => void
  onDone: () => void
}) {
  const { service } = useApp()
  const [quantity, setQuantity] = useState(offer?.quantity ?? delivery?.quantity ?? NaN)
  const [cost, setCost] = useState(offer?.unitCost ?? lastCost ?? currentCost ?? NaN)
  // Receiving an offer logs it as BUY-OFFER-<id>, which marks the offer Accepted for the supplier.
  const [purchaseId] = useState(() => (offer ? offerPurchaseId(offer.id) : newId('P')))
  // Adding stock must not run twice: once it's done, a retry only finishes the remaining steps.
  const [stockAdded, setStockAdded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string>()

  const errors: Partial<Record<BuyKey, string>> = {}
  if (Number.isNaN(quantity)) errors.quantity = 'Enter how many pieces you bought.'
  else if (!Number.isInteger(quantity) || quantity <= 0) errors.quantity = 'Use a whole number above 0.'
  else if (quantity > 100_000) errors.quantity = 'That quantity looks too high. Check the number.'
  const ce = costError(cost)
  if (ce) errors.cost = ce
  // A preview from the stock shown; the save works it out again from fresh stock.
  const after = errors.quantity || errors.cost ? undefined : afterPurchase(item, currentCost, rule, quantity, cost)

  const shown = (k: BuyKey) => (submitted && errors[k]) || undefined
  const field = (k: BuyKey, label: string, value: number, onChange: (n: number) => void, step: number) => (
    <label className="field">
      <span>{label}</span>
      <input
        id={`bs-${k}`}
        type="number"
        inputMode={step === 1 ? 'numeric' : 'decimal'}
        min={0}
        step={step}
        value={numberValue(value)}
        disabled={busy || stockAdded}
        onChange={(e) => onChange(readNumber(e.target.value))}
        aria-invalid={shown(k) ? true : undefined}
        aria-describedby={shown(k) ? `bs-${k}-error` : undefined}
      />
      {shown(k) && (
        <span className="field-error" id={`bs-${k}-error`}>
          <Icon name="alert" size={14} />
          {shown(k)}
        </span>
      )}
    </label>
  )

  async function save() {
    setSubmitted(true)
    setError(undefined)
    const first = (['quantity', 'cost'] as const).find((k) => errors[k])
    if (first) {
      document.getElementById(`bs-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      await receiveStock(
        service,
        { item, quantity, unitCost: cost, purchaseId, requestIds: delivery?.requestIds },
        stockAdded,
        () => setStockAdded(true),
      )
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={`${delivery ? 'Received' : 'Buy stock'}: ${item.name}`} onClose={onCancel} closeDisabled={busy}>
      {offer && <p className="notice">From {offer.supplierName}'s offer: {offer.quantity} × {formatLkr(offer.unitCost)}. Change the numbers if the delivery is different.</p>}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <p className="muted">
          {item.category}, {item.size}, {item.colour}. {item.stock} in stock now.
        </p>
        <div className="form-grid">
          {field('quantity', 'Quantity bought', quantity, setQuantity, 1)}
          {field('cost', 'Cost per piece (LKR)', cost, setCost, 0.01)}
          <div className="field wide price-hint">
            <dl className="price-change">
              <div>
                <dt>Average cost</dt>
                <dd>
                  {after ? (
                    <>
                      {currentCost !== undefined && currentCost !== after.cost && <span className="muted">{formatLkr(currentCost)} → </span>}
                      {formatLkr(after.cost)}
                    </>
                  ) : (
                    '–'
                  )}
                </dd>
              </div>
              <div>
                <dt>{item.autoPrice ? 'Price (Auto)' : 'Price (Fixed)'}</dt>
                <dd>
                  {after && after.price !== item.price && <span className="muted">{formatLkr(item.price)} → </span>}
                  {formatLkr(after?.price ?? item.price)}
                </dd>
              </div>
              <div>
                <dt>Profit per piece</dt>
                <dd>{after ? formatLkr(after.price - after.cost) : '–'}</dd>
              </div>
            </dl>
            <p className="muted small">
              {!item.autoPrice
                ? 'This item has a fixed price, so it stays. Switch it to Auto price in Edit to follow the profit rule.'
                : rule
                  ? `The price follows the ${item.category} profit rule (${describeRule(rule)}) at the new average cost.`
                  : `No ${item.category} profit rule yet, so the price stays. Set one in Profit rules.`}
            </p>
            {after && <LossWarning cost={after.cost} price={after.price} />}
          </div>
        </div>
        {error && <p className="notice notice-bad" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            {stockAdded ? 'Close' : 'Cancel'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : stockAdded ? 'Try again' : 'Add to stock'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

interface RuleDraft {
  percent: string
  fixed: string
  roundTo: number
}

/** The cost the Example column prices. */
const EXAMPLE_COST = 1000

/** A rule about to be saved (or already saved) and the Auto prices it changes, waiting for Apply. */
interface Pending {
  rule: ProfitRule
  /** False when the rule is already saved and only the prices need updating. */
  saveRule: boolean
  changes: PriceChange[]
}

/**
 * The profit wanted on each clothing type. Auto-priced items follow these: saving a rule shows
 * which prices change, and Apply saves the rule and updates them together.
 */
function PricingTab() {
  const { service } = useApp()
  const costs = usePolled(() => service.listCosts(), [service], 15000)
  const clothes = usePolled(() => service.listClothes(), [service], 30000)
  const { rules, cost } = usePricing(costs.data)
  const [drafts, setDrafts] = useState<Record<string, RuleDraft>>({})
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>()

  const draftOf = (category: string): RuleDraft => {
    const saved = rules.get(category)
    return (
      drafts[category] ?? {
        percent: saved?.percent ? String(saved.percent) : '',
        fixed: saved?.fixed ? String(saved.fixed) : '',
        roundTo: saved?.roundTo ?? 10,
      }
    )
  }
  // An empty box means none of that kind, so a rule can be percent only, fixed only or both.
  const parse = (category: string, d: RuleDraft): ProfitRule => ({
    category,
    percent: d.percent.trim() === '' ? 0 : Number(d.percent),
    fixed: d.fixed.trim() === '' ? 0 : Number(d.fixed),
    roundTo: d.roundTo,
  })
  const edit = (category: string, patch: Partial<RuleDraft>) => {
    setPending(null)
    setDrafts((all) => ({ ...all, [category]: { ...draftOf(category), ...patch } }))
  }
  const changesFor = (rule: ProfitRule) =>
    outOfDatePrices(clothes.data ?? [], cost, new Map([...rules, [rule.category, rule]]), rule.category)

  /** Saves straight away when no price changes; otherwise asks first. */
  function save(category: string) {
    const rule = parse(category, draftOf(category))
    const changes = changesFor(rule)
    if (changes.length === 0) void apply({ rule, saveRule: true, changes })
    else setPending({ rule, saveRule: true, changes })
  }

  async function apply(p: Pending) {
    const { category } = p.rule
    setBusy(category)
    setMsg(undefined)
    try {
      if (p.saveRule) await service.saveProfitRule(p.rule)
      await service.updatePrices(p.changes.map((c) => ({ clothingId: c.clothingId, price: c.to })))
      await Promise.all([costs.reload(), clothes.reload()])
      setDrafts((all) => {
        const rest = { ...all }
        delete rest[category]
        return rest
      })
      setPending(null)
      const prices = p.changes.length ? ` ${p.changes.length} ${p.changes.length === 1 ? 'price' : 'prices'} updated.` : ''
      setMsg({ text: `${category}: ${describeRule(p.rule)}.${prices}`, bad: false })
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), bad: true })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p className="muted">
        Selling price = cost + profit percent of the cost + fixed amount, rounded up. Use a percent, a fixed amount or both.
        Items on <strong>Auto price</strong> follow these rules; items on <strong>Fixed price</strong> keep the price you set.
      </p>
      {msg && (
        <p className={`notice${msg.bad ? ' notice-bad' : ''}`} role={msg.bad ? 'alert' : 'status'}>
          {msg.text}
        </p>
      )}
      {costs.error && <p className="notice notice-bad" role="alert">{costs.error}</p>}
      {pending && (
        <section className="card price-preview" aria-labelledby="preview-title">
          <h3 id="preview-title">
            {pending.saveRule ? `Saving ${pending.rule.category} at ${describeRule(pending.rule)} changes` : 'Update'}{' '}
            {pending.changes.length} {pending.changes.length === 1 ? 'price' : 'prices'}
          </h3>
          <ul className="change-list">
            {pending.changes.map((c) => (
              <li key={c.clothingId}>
                <span>{c.name}</span>
                <span>
                  <span className="muted">{formatLkr(c.from)} →</span> <strong>{formatLkr(c.to)}</strong>
                </span>
              </li>
            ))}
          </ul>
          <p className="muted small">Customers see the new prices straight away. Items on Fixed price aren't changed.</p>
          <div className="row-actions">
            <button className="btn" disabled={busy !== null} onClick={() => setPending(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy !== null} onClick={() => void apply(pending)}>
              {busy ? 'Saving…' : pending.saveRule ? 'Save and update prices' : 'Update prices'}
            </button>
          </div>
        </section>
      )}
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Profit %</th>
            <th scope="col">+ Fixed (LKR)</th>
            <th scope="col">Round up to</th>
            <th scope="col">Example</th>
            <th scope="col"><span className="sr-only">Save</span></th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((category) => {
            const d = draftOf(category)
            const rule = parse(category, d)
            const errors: RuleErrors = validateRule(rule)
            const changed = !!drafts[category]
            const problem = changed ? Object.values(errors)[0] : undefined
            const saved = rules.get(category)
            // Auto prices that don't match the saved rule yet (e.g. set before the rule existed).
            const stale = saved && !changed ? changesFor(saved) : []
            return (
              <tr key={category}>
                <td data-label="Type">
                  <strong>{category}</strong>
                  <p className="muted small">
                    {saved ? describeRule(saved) : costs.data ? <span className="tone-warn-text">Not set</span> : null}
                  </p>
                  {stale.length > 0 && (
                    <button
                      className="ghost-btn small"
                      disabled={busy !== null}
                      onClick={() => setPending({ rule: saved!, saveRule: false, changes: stale })}
                    >
                      {stale.length} Auto {stale.length === 1 ? 'price is' : 'prices are'} out of date · Review
                    </button>
                  )}
                </td>
                <td data-label="Profit %">
                  <input
                    className="cost-input"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    placeholder="0"
                    aria-label={`Profit percent for ${category}`}
                    aria-invalid={changed && errors.percent ? true : undefined}
                    value={d.percent}
                    disabled={!costs.data || !clothes.data}
                    onChange={(e) => edit(category, { percent: e.target.value })}
                  />
                </td>
                <td data-label="+ Fixed (LKR)">
                  <input
                    className="cost-input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    placeholder="0"
                    aria-label={`Fixed profit in LKR for ${category}`}
                    aria-invalid={changed && errors.fixed ? true : undefined}
                    value={d.fixed}
                    disabled={!costs.data || !clothes.data}
                    onChange={(e) => edit(category, { fixed: e.target.value })}
                  />
                </td>
                <td data-label="Round up to">
                  <select
                    aria-label={`Rounding for ${category}`}
                    value={d.roundTo}
                    disabled={!costs.data || !clothes.data}
                    onChange={(e) => edit(category, { roundTo: Number(e.target.value) })}
                  >
                    {ROUND_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? 'No rounding' : `LKR ${n}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Example">
                  {Object.keys(errors).length === 0
                    ? `${formatLkr(EXAMPLE_COST)} → ${formatLkr(priceFromCost(EXAMPLE_COST, rule))}`
                    : '–'}
                  {problem && <span className="field-error">{problem}</span>}
                </td>
                <td>
                  <button className="btn" disabled={!changed || !!problem || busy !== null} onClick={() => save(category)}>
                    {busy === category ? 'Saving…' : 'Save'}
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
