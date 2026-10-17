import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { Stepper } from '../components/Stepper'
import { formatLkr } from '../domain/format'
import type { Clothing, SimulatedPayment } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'

const MAX_QTY = 10

type Availability = { kind: 'ok' | 'low' | 'out' | 'off'; text: string }

function availability(c: Clothing): Availability {
  if (!c.isActive) return { kind: 'off', text: 'Not available' }
  if (c.stock <= 0) return { kind: 'out', text: 'Sold out' }
  if (c.stock <= c.lowStockThreshold) return { kind: 'low', text: `Only ${c.stock} left` }
  return { kind: 'ok', text: `${c.stock} in stock` }
}

export function ShopPage({ onOrdered }: { onOrdered: () => void }) {
  const { service } = useApp()
  const { data, error, loading, reload } = usePolled(() => service.listClothes(), [service], 15000)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [checkout, setCheckout] = useState<{ item: Clothing; qty: number } | null>(null)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set((data ?? []).map((c) => c.category).filter(Boolean))).sort()],
    [data],
  )
  const shown = (data ?? []).filter(
    (c) =>
      (category === 'All' || c.category === category) &&
      `${c.name} ${c.colour} ${c.size} ${c.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const filtering = search.trim() !== '' || category !== 'All'

  return (
    <section aria-labelledby="shop-title">
      <div className="page-head">
        <h2 id="shop-title">Shop</h2>
        {data && (
          <p className="muted">
            {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}
          </p>
        )}
      </div>

      <div className="finder">
        <label className="search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search clothing</span>
          <input
            type="search"
            placeholder="Search by name, colour or size"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="chips" role="group" aria-label="Category">
          {categories.map((c) => (
            <button key={c} className="chip-btn" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="notice notice-bad" role="alert">
          <p>Couldn't load the clothing. {error}</p>
          <button className="btn" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="grid" aria-busy="true" aria-label="Loading clothing">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="tile tile-skel" aria-hidden="true" />
          ))}
        </div>
      )}

      {!loading && !error && shown.length === 0 && (
        <div className="empty">
          <p>{filtering ? 'Nothing matches that search.' : 'No clothing has been added yet.'}</p>
          {filtering && (
            <button
              className="btn"
              onClick={() => {
                setSearch('')
                setCategory('All')
              }}
            >
              Clear search and filters
            </button>
          )}
        </div>
      )}

      <div className="grid">
        {shown.map((c) => (
          <Tile key={c.id} item={c} onBuy={(qty) => setCheckout({ item: c, qty })} />
        ))}
      </div>

      {checkout && (
        <CheckoutSheet
          item={checkout.item}
          qty={checkout.qty}
          onClose={() => {
            setCheckout(null)
            void reload()
          }}
          onDone={() => {
            setCheckout(null)
            onOrdered()
          }}
        />
      )}
    </section>
  )
}

function Tile({ item, onBuy }: { item: Clothing; onBuy: (qty: number) => void }) {
  const [qty, setQty] = useState(1)
  const a = availability(item)
  const blocked = a.kind === 'out' || a.kind === 'off'
  const max = Math.max(1, Math.min(MAX_QTY, item.stock))
  return (
    <article className={`tile${blocked ? ' tile-off' : ''}`}>
      <div className="photo">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="photo-empty">No photo</div>
        )}
        {item.size && (
          <span className="size-tag" aria-label={`Size ${item.size}`}>
            {item.size}
          </span>
        )}
        {blocked && <span className="sold-band">{a.text}</span>}
      </div>
      <div className="tile-info">
        <h3>{item.name}</h3>
        <p className="muted">
          {item.colour}
          {item.category ? `, ${item.category}` : ''}
        </p>
        <p className="price">{formatLkr(item.price)}</p>
        {/* Sold-out state already shows on the photo and the button, so this line stays an empty spacer to keep rows aligned. */}
        <p className={`avail avail-${a.kind}`}>{blocked ? ' ' : a.text}</p>
        <div className="buy-row">
          <Stepper value={qty} max={max} onChange={setQty} label={`Quantity of ${item.name}`} disabled={blocked} />
          <button className="btn btn-buy" disabled={blocked} onClick={() => onBuy(Math.min(qty, max))}>
            {blocked ? a.text : 'Buy'}
          </button>
        </div>
      </div>
    </article>
  )
}

function CheckoutSheet({
  item,
  qty,
  onClose,
  onDone,
}: {
  item: Clothing
  qty: number
  onClose: () => void
  onDone: () => void
}) {
  const { service } = useApp()
  // One RequestId per checkout: retries and double clicks reuse it, so they can't place a second order.
  const [requestId] = useState(() => `REQ-${crypto.randomUUID()}`)
  const [payment, setPayment] = useState<SimulatedPayment>('Success')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      await service.placeOrder({ requestId, clothingId: item.id, quantity: qty, simulatedPayment: payment })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title="Test checkout" onClose={onClose} closeDisabled={busy}>
      <p className="ticket">No real payment is taken. Choose the result you want to test.</p>

      <div className="line-item">
        {item.photoUrl && <img src={item.photoUrl} alt="" />}
        <div>
          <strong>{item.name}</strong>
          <p className="muted">
            {item.colour}, size {item.size}, quantity {qty}
          </p>
        </div>
        <span className="price">{formatLkr(item.price * qty)}</span>
      </div>
      <p className="muted small">The price and stock are checked again when the order is processed.</p>

      <fieldset className="choice" disabled={busy}>
        <legend>Simulated payment result</legend>
        <label className={payment === 'Success' ? 'on' : ''}>
          <input type="radio" name="pay" checked={payment === 'Success'} onChange={() => setPayment('Success')} />
          <span>Payment succeeds</span>
        </label>
        <label className={payment === 'Failed' ? 'on' : ''}>
          <input type="radio" name="pay" checked={payment === 'Failed'} onChange={() => setPayment('Failed')} />
          <span>Payment fails</span>
        </label>
      </fieldset>

      {error && (
        <p className="notice notice-bad" role="alert">
          {error}
        </p>
      )}

      <div className="sheet-actions">
        <button className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Placing order…' : error ? 'Try again' : `Place test order, ${formatLkr(item.price * qty)}`}
        </button>
      </div>
    </Sheet>
  )
}
