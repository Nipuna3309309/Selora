import { useMemo, useState } from 'react'
import { formatLkr } from '../domain/format'
import type { Clothing, SimulatedPayment } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'

const MAX_QTY = 10

function unavailableReason(c: Clothing): string | null {
  if (!c.isActive) return 'Unavailable'
  if (c.stock <= 0) return 'Out of stock'
  return null
}

export function ShopPage({ onOrdered }: { onOrdered: () => void }) {
  const { service } = useApp()
  const { data, error, loading, reload } = usePolled(() => service.listClothes(), [service], 15000)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [checkout, setCheckout] = useState<{ item: Clothing; qty: number } | null>(null)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set((data ?? []).map((c) => c.category))).sort()],
    [data],
  )
  const shown = (data ?? []).filter(
    (c) =>
      (category === 'All' || c.category === category) &&
      `${c.name} ${c.colour} ${c.size} ${c.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <section>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search clothing"
          aria-label="Search clothing"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p className="muted">Loading clothing…</p>}
      {!loading && shown.length === 0 && <p className="muted">No clothing matches your search.</p>}
      <div className="grid">
        {shown.map((c) => (
          <ClothingCard key={c.id} item={c} onBuy={(qty) => setCheckout({ item: c, qty })} />
        ))}
      </div>
      {checkout && (
        <CheckoutDialog
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

function ClothingCard({ item, onBuy }: { item: Clothing; onBuy: (qty: number) => void }) {
  const [qty, setQty] = useState(1)
  const blocked = unavailableReason(item)
  const max = Math.max(1, Math.min(MAX_QTY, item.stock))
  return (
    <article className={`card${blocked ? ' card-off' : ''}`}>
      <img src={item.imageUrl} alt={item.name} loading="lazy" />
      <div className="card-body">
        <h3>{item.name}</h3>
        <p className="price">{formatLkr(item.price)}</p>
        <p className="muted">
          Size {item.size} · {item.colour}
        </p>
        <p className={item.stock > 0 && item.isActive ? 'stock' : 'stock stock-out'}>
          {blocked ?? `${item.stock} in stock`}
        </p>
        <div className="buy-row">
          <label>
            <span className="sr-only">Quantity for {item.name}</span>
            <select value={qty} disabled={!!blocked} onChange={(e) => setQty(Number(e.target.value))}>
              {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={!!blocked} onClick={() => onBuy(Math.min(qty, max))}>
            {blocked ?? 'Buy'}
          </button>
        </div>
      </div>
    </article>
  )
}

function CheckoutDialog({
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
  // One stable RequestId per checkout: retries and double clicks reuse it.
  const [requestId] = useState(() => `REQ-${crypto.randomUUID()}`)
  const [payment, setPayment] = useState<SimulatedPayment>('Success')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit() {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      await service.placeOrder({
        requestId,
        clothingId: item.id,
        quantity: qty,
        simulatedPayment: payment,
      })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Test checkout">
      <div className="dialog">
        <p className="banner banner-test">TEST CHECKOUT · No real payment is taken</p>
        <h2>{item.name}</h2>
        <p>
          {qty} × {formatLkr(item.price)} = <strong>{formatLkr(item.price * qty)}</strong>
        </p>
        <p className="muted">The final price and stock are re-checked when the order is processed.</p>
        <fieldset disabled={busy}>
          <legend>Simulated payment result</legend>
          <label className="radio">
            <input type="radio" name="pay" checked={payment === 'Success'} onChange={() => setPayment('Success')} />
            Payment succeeds
          </label>
          <label className="radio">
            <input type="radio" name="pay" checked={payment === 'Failure'} onChange={() => setPayment('Failure')} />
            Payment fails
          </label>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="primary" onClick={() => void submit()} disabled={busy}>
            {busy ? 'Placing order…' : error ? 'Retry order' : 'Place test order'}
          </button>
        </div>
      </div>
    </div>
  )
}
