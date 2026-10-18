import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { Sheet } from '../components/Sheet'
import { useApp } from '../context'
import { formatLkr, todayBusinessDate } from '../domain/format'
import { suggestedQuantity } from '../domain/restock'
import { NOTE_MAX, validateOffer, type OfferErrors, type OfferStatus, type SupplierRequest } from '../domain/supplier'
import type { Clothing } from '../domain/types'
import type { SupplierView } from '../services/ShopService'
import { usePolled } from '../usePolled'

export type SupplierSection = 'requests' | 'offers'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const dateOnly = (ymd: string) => (ymd ? day(`${ymd}T00:00:00`) : '–')
const STATUS_TONE: Record<OfferStatus, string> = { Waiting: 'wait', Accepted: 'ok', 'Not needed': 'bad' }

type MyOffer = SupplierView['offers'][number]

/** The supplier's area: what the shop needs, and the offers they've sent. */
export function SupplierPage({ section }: { section: SupplierSection }) {
  const { service } = useApp()
  const view = usePolled(() => service.supplierView(), [service], 30000)
  const clothes = usePolled(() => service.listClothes(), [service], 60000)
  const byId = useMemo(() => new Map((clothes.data ?? []).map((c) => [c.id, c])), [clothes.data])
  const [offering, setOffering] = useState<{ request: SupplierRequest; current?: MyOffer } | null>(null)
  const [msg, setMsg] = useState<string>()
  const error = view.error ?? clothes.error

  const head = (
    <div className="page-head">
      <h2>{section === 'requests' ? 'Restock requests' : 'My offers'}</h2>
    </div>
  )
  if (error && !view.data) return <section>{head}<p className="notice notice-bad" role="alert">{error}</p></section>
  if (!view.data) return <section aria-busy="true">{head}<div className="slip slip-skel" /></section>

  const { requests, offers } = view.data
  const mine = new Map(offers.filter((o) => o.status === 'Waiting').map((o) => [o.requestId, o]))

  return (
    <section>
      {head}
      {msg && <p className="notice" role="status">{msg}</p>}
      {section === 'requests' ? (
        <>
          <p className="muted">
            Items the shop wants more of. Send an offer with how many pieces you can supply and your price; the shop
            accepts it when the goods arrive.
          </p>
          {requests.length === 0 ? (
            <div className="empty">
              <p>No open requests right now. New ones show here and arrive by email.</p>
            </div>
          ) : (
            <ul className="request-list">
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  item={byId.get(r.clothingId)}
                  offer={mine.get(r.id)}
                  onOffer={() => setOffering({ request: r, current: mine.get(r.id) })}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <OfferTable offers={offers} byId={byId} />
      )}
      {offering && (
        <OfferSheet
          request={offering.request}
          item={byId.get(offering.request.clothingId)}
          current={offering.current}
          onCancel={() => setOffering(null)}
          onSent={() => {
            setOffering(null)
            setMsg('Offer sent. The shop sees it straight away.')
            void view.reload()
          }}
        />
      )}
    </section>
  )
}

function RequestCard({ request, item, offer, onOffer }: { request: SupplierRequest; item?: Clothing; offer?: MyOffer; onOffer: () => void }) {
  const wanted = suggestedQuantity(request.note)
  // The suggested quantity is part of the note; show the rest as the shop's note.
  const note = request.note.replace(/Suggested order: \d+ units\.?\s*/i, '').trim()
  return (
    <li className="card request">
      <span className="thumb thumb-lg">{item?.photoUrl ? <Photo url={item.photoUrl} alt="" /> : null}</span>
      <div className="request-text">
        <strong>{item?.name ?? `Item ${request.clothingId}`}</strong>
        <p className="muted small">
          {item ? `${item.sku} · ${item.category}, ${item.size}, ${item.colour}` : 'Item details unavailable'} · asked {day(request.createdAt)}
        </p>
        <p className="small">
          {item && <>Shop has {item.stock} left</>}
          {wanted !== undefined && <> · asks for <strong>{wanted}</strong></>}
        </p>
        {note && <p className="small request-note">“{note}”</p>}
        {offer && (
          <p className="small">
            <span className="chip tone-wait">Your offer</span> {offer.quantity} × {formatLkr(offer.unitCost)}
            {offer.arriveBy && <>, arriving {dateOnly(offer.arriveBy)}</>}
          </p>
        )}
        {offer?.counter && (
          <p className="small">
            <span className="chip tone-bad">Shop's counter</span> {offer.counter.quantity} × {formatLkr(offer.counter.unitCost)}
            {offer.counter.note && <> · “{offer.counter.note}”</>}. Change your offer to answer it.
          </p>
        )}
      </div>
      <button className={`btn ${offer ? '' : 'btn-primary'}`} onClick={onOffer}>
        <Icon name="send" size={16} />
        {offer ? 'Change offer' : 'Send offer'}
      </button>
    </li>
  )
}

function OfferTable({ offers, byId }: { offers: MyOffer[]; byId: Map<string, Clothing> }) {
  if (offers.length === 0)
    return (
      <div className="empty">
        <p>You haven't sent any offers yet. Open Restock requests to send one.</p>
      </div>
    )
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Pieces</th>
          <th scope="col">Price each</th>
          <th scope="col">Total</th>
          <th scope="col">Arriving</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((o) => (
          <tr key={o.id}>
            <td data-label="Item">
              <strong>{byId.get(o.clothingId)?.name ?? `Item ${o.clothingId}`}</strong>
              <p className="muted small">Sent {day(o.createdAt)}{o.note && ` · “${o.note}”`}</p>
            </td>
            <td data-label="Pieces">{o.quantity}</td>
            <td data-label="Price each">{formatLkr(o.unitCost)}</td>
            <td data-label="Total">{formatLkr(o.quantity * o.unitCost)}</td>
            <td data-label="Arriving">{dateOnly(o.arriveBy)}</td>
            <td data-label="Status">
              <span className={`chip tone-${STATUS_TONE[o.status]}`}>{o.status}</span>
              {o.status === 'Waiting' && o.counter && <p className="muted small">Shop asks {o.counter.quantity} × {formatLkr(o.counter.unitCost)}</p>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function OfferSheet({
  request,
  item,
  current,
  onCancel,
  onSent,
}: {
  request: SupplierRequest
  item?: Clothing
  current?: MyOffer
  onCancel: () => void
  onSent: () => void
}) {
  const { service } = useApp()
  const today = todayBusinessDate()
  const counter = current?.counter
  const [quantity, setQuantity] = useState(counter?.quantity ?? current?.quantity ?? suggestedQuantity(request.note) ?? NaN)
  const [unitCost, setUnitCost] = useState(counter?.unitCost ?? current?.unitCost ?? NaN)
  const [arriveBy, setArriveBy] = useState(current?.arriveBy ?? '')
  const [note, setNote] = useState(current?.note ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const errors: OfferErrors = validateOffer({ quantity, unitCost, arriveBy, note }, today)
  const shown = (k: keyof OfferErrors) =>
    submitted && errors[k] ? (
      <span className="field-error" id={`of-${k}-error`}>
        <Icon name="alert" size={14} />
        {errors[k]}
      </span>
    ) : null
  const aria = (k: keyof OfferErrors) => ({
    id: `of-${k}`,
    'aria-invalid': submitted && errors[k] ? true : undefined,
    'aria-describedby': submitted && errors[k] ? `of-${k}-error` : undefined,
  })
  const readNumber = (v: string) => (v.trim() === '' ? NaN : Number(v))

  async function send() {
    setSubmitted(true)
    setError(undefined)
    const first = (['quantity', 'unitCost', 'arriveBy', 'note'] as const).find((k) => errors[k])
    if (first) {
      document.getElementById(`of-${first}`)?.focus()
      return
    }
    setBusy(true)
    try {
      await service.sendOffer({ requestId: request.id, quantity, unitCost, arriveBy, note })
      onSent()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Sheet title={`${current ? 'Change offer' : 'Send offer'}: ${item?.name ?? `item ${request.clothingId}`}`} onClose={onCancel} closeDisabled={busy}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        {counter && (
          <p className="notice">
            The shop countered with {counter.quantity} × {formatLkr(counter.unitCost)}
            {counter.note && <> (“{counter.note}”)</>}. The boxes start from that. Keep your own numbers or change them, then send.
          </p>
        )}
        {item && (
          <p className="muted">
            {item.sku} · {item.size}, {item.colour}. The shop has {item.stock} left.
          </p>
        )}
        <div className="form-grid">
          <label className="field">
            <span>Pieces you can send</span>
            <input type="number" inputMode="numeric" min={1} step={1} value={Number.isNaN(quantity) ? '' : quantity}
              disabled={busy} onChange={(e) => setQuantity(readNumber(e.target.value))} {...aria('quantity')} />
            {shown('quantity')}
          </label>
          <label className="field">
            <span>Your price per piece (LKR)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={Number.isNaN(unitCost) ? '' : unitCost}
              disabled={busy} onChange={(e) => setUnitCost(readNumber(e.target.value))} {...aria('unitCost')} />
            {shown('unitCost')}
          </label>
          <label className="field">
            <span>Arriving by (optional)</span>
            <input type="date" min={today} value={arriveBy} disabled={busy} onChange={(e) => setArriveBy(e.target.value)} {...aria('arriveBy')} />
            {shown('arriveBy')}
          </label>
          <label className="field wide">
            <span>Note (optional)</span>
            <input maxLength={NOTE_MAX} value={note} disabled={busy} placeholder="e.g. Two colours available"
              onChange={(e) => setNote(e.target.value)} {...aria('note')} />
            {shown('note')}
          </label>
          {!Number.isNaN(quantity) && !Number.isNaN(unitCost) && (
            <p className="field wide small">
              Total: <strong>{formatLkr(quantity * unitCost)}</strong>
            </p>
          )}
        </div>
        {error && <p className="notice notice-bad" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Sending…' : current ? 'Update offer' : 'Send offer'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
