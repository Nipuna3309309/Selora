import { useState } from 'react'
import { clearCart, MAX_QTY, removeFromCart, setCartQuantity, useCart } from '../cart'
import { formatLkr } from '../domain/format'
import type { CheckoutInput } from '../domain/types'
import { useApp } from '../context'
import { usePolled } from '../usePolled'
import { Icon } from './Icon'
import { Photo } from './Photo'
import { Sheet } from './Sheet'
import { Stepper } from './Stepper'

type Payment = CheckoutInput['payment']

const PAYMENTS: { id: Payment; label: string; note: string }[] = [
  { id: 'Success', label: 'Pay now', note: 'Payment is recorded as paid.' },
  { id: 'Cash on delivery', label: 'Cash on delivery', note: 'You pay when the order reaches you.' },
]

export function CartSheet({ onClose, onPlaced }: { onClose: () => void; onPlaced: () => void }) {
  const { service } = useApp()
  const cart = useCart()
  const { data, error: loadError, loading } = usePolled(() => service.listClothes(), [service], 15000)
  // One id per checkout: retries and double clicks reuse it, so they can't place a second order.
  const [checkoutId] = useState(() => `CHK-${crypto.randomUUID()}`)
  const [payment, setPayment] = useState<Payment>('Success')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const lines = cart.map((l) => {
    const item = data?.find((c) => c.id === l.clothingId)
    const sellable = !!item && item.isActive && item.stock > 0
    const max = item ? Math.max(1, Math.min(MAX_QTY, item.stock)) : MAX_QTY
    return { ...l, item, sellable, max, quantity: Math.min(l.quantity, max) }
  })
  const ready = lines.filter((l) => l.sellable)
  const total = ready.reduce((sum, l) => sum + (l.item?.price ?? 0) * l.quantity, 0)
  const blocked = lines.length > 0 && (loading || !!loadError)

  async function submit() {
    if (busy || ready.length === 0) return
    setBusy(true)
    setError(undefined)
    try {
      await service.placeCheckout({
        checkoutId,
        lines: ready.map((l) => ({ clothingId: l.clothingId, quantity: l.quantity })),
        payment,
      })
      clearCart()
      onPlaced()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title="Your cart" onClose={onClose} closeDisabled={busy}>
      {lines.length === 0 ? (
        <div className="empty">
          <p>Your cart is empty. Add something from the shop.</p>
          <button className="btn" onClick={onClose}>
            Keep shopping
          </button>
        </div>
      ) : (
        <>
          {loadError && (
            <p className="notice notice-bad" role="alert">
              Couldn't load prices. {loadError}
            </p>
          )}
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.clothingId} className={l.sellable || loading ? '' : 'cart-off'}>
                <span className="line-photo">{l.item?.photoUrl ? <Photo url={l.item.photoUrl} alt="" /> : null}</span>
                <div className="cart-info">
                  <strong>{l.item?.name ?? (loading ? 'Loading…' : 'No longer available')}</strong>
                  {l.item && (
                    <p className="muted small">
                      {l.item.colour}, size {l.item.size}
                    </p>
                  )}
                  {!loading && !l.sellable && (
                    <p className="small cart-warn">
                      {l.item && l.item.stock <= 0 ? 'Sold out. It will be left out of this order.' : 'No longer available. It will be left out of this order.'}
                    </p>
                  )}
                  {l.sellable && l.item && l.quantity < l.item.stock && l.item.stock <= l.item.lowStockThreshold && (
                    <p className="small cart-warn">Only {l.item.stock} left</p>
                  )}
                  <div className="cart-actions">
                    <Stepper
                      value={l.quantity}
                      max={l.max}
                      onChange={(n) => setCartQuantity(l.clothingId, n)}
                      label={`Quantity of ${l.item?.name ?? 'item'}`}
                      disabled={!l.sellable || busy}
                    />
                    <button type="button" className="ghost-btn" disabled={busy} onClick={() => removeFromCart(l.clothingId)}>
                      Remove
                    </button>
                  </div>
                </div>
                <span className="price">{l.sellable && l.item ? formatLkr(l.item.price * l.quantity) : ''}</span>
              </li>
            ))}
          </ul>

          <fieldset className="choice" disabled={busy}>
            <legend>Payment</legend>
            {PAYMENTS.map((p) => (
              <label key={p.id} className={payment === p.id ? 'on' : ''}>
                <input type="radio" name="pay" checked={payment === p.id} onChange={() => setPayment(p.id)} />
                <span>
                  {p.label}
                  <span className="muted small pay-note">{p.note}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="muted small">Prices and stock are checked again when each item is processed.</p>

          {error && (
            <p className="notice notice-bad" role="alert">
              {error}
            </p>
          )}

          <div className="sheet-actions">
            <button className="btn" onClick={onClose} disabled={busy}>
              Close
            </button>
            <button className="btn btn-primary" onClick={() => void submit()} disabled={busy || blocked || ready.length === 0}>
              <Icon name="cart" size={16} />
              {busy ? 'Placing order…' : error ? 'Try again' : `Place order, ${formatLkr(total)}`}
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
