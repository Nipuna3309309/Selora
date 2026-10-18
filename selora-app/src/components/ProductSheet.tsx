import { useEffect, useState, type CSSProperties } from 'react'
import { addToCart, MAX_QTY } from '../cart'
import { availability } from '../domain/availability'
import { formatLkr } from '../domain/format'
import { COLOURS, type Clothing } from '../domain/types'
import { Icon } from './Icon'
import { Photo } from './Photo'
import { Sheet } from './Sheet'
import { Stepper } from './Stepper'

/**
 * One cloth in its own window. The arrows (and the left and right keys) step through the
 * clothes that are currently shown in the shop, one by one.
 */
export function ProductSheet({
  items,
  id,
  onChange,
  onClose,
}: {
  items: Clothing[]
  id: string
  onChange: (id: string) => void
  onClose: () => void
}) {
  const index = items.findIndex((c) => c.id === id)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const item = items[index]

  const prev = index > 0 ? items[index - 1] : undefined
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : undefined

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if (e.key === 'ArrowRight' && next) {
        setDir('next')
        onChange(next.id)
      } else if (e.key === 'ArrowLeft' && prev) {
        setDir('prev')
        onChange(prev.id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next, onChange])

  if (!item) return null
  return (
    <Sheet title={item.name} onClose={onClose} className="sheet-wide">
      <ProductBody key={item.id} item={item} dir={dir} />
      <nav className="pv-nav" aria-label="Browse clothes">
        <button
          className="btn"
          disabled={!prev}
          onClick={() => {
            if (!prev) return
            setDir('prev')
            onChange(prev.id)
          }}
        >
          <span className="flip">
            <Icon name="arrow" size={16} />
          </span>
          <span className="pv-nav-name">{prev ? prev.name : 'Previous'}</span>
        </button>
        <span className="muted small" aria-live="polite">
          {index + 1} of {items.length}
        </span>
        <button
          className="btn"
          disabled={!next}
          onClick={() => {
            if (!next) return
            setDir('next')
            onChange(next.id)
          }}
        >
          <span className="pv-nav-name">{next ? next.name : 'Next'}</span>
          <Icon name="arrow" size={16} />
        </button>
      </nav>
    </Sheet>
  )
}

function ProductBody({ item, dir }: { item: Clothing; dir: 'next' | 'prev' }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(0)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(0), 1800)
    return () => clearTimeout(t)
  }, [added])

  const a = availability(item)
  const blocked = a.kind === 'out' || a.kind === 'off'
  const max = Math.max(1, Math.min(MAX_QTY, item.stock))
  const q = Math.min(qty, max)
  const swatch = COLOURS.find((c) => c.name.toLowerCase() === item.colour.trim().toLowerCase())

  return (
    <div className={`pv pv-${dir}`}>
      <div className={`photo pv-photo${blocked ? ' tile-off' : ''}`}>
        {item.photoUrl ? <Photo url={item.photoUrl} alt={item.name} saveAs={item.name} /> : <div className="photo-empty">No photo</div>}
        {blocked && <span className="sold-band">{a.text}</span>}
      </div>

      <div className="pv-info">
        {item.category && <p className="pv-cat">{item.category}</p>}
        <p className="price pv-price" key={q}>
          {formatLkr(item.price * q)}
        </p>
        {q > 1 && <p className="muted small">{formatLkr(item.price)} each</p>}

        <dl className="pv-facts" style={{ '--n': 0 } as CSSProperties}>
          <div>
            <dt>Colour</dt>
            <dd>
              {swatch && <span className="dot" style={{ '--sw': swatch.hex } as CSSProperties} aria-hidden="true" />}
              {item.colour || 'Not set'}
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>
              <span className="size-pill">{item.size || 'Not set'}</span>
            </dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd className={`avail-${a.kind}`}>{a.text}</dd>
          </div>
        </dl>

        <div className="pv-buy">
          <Stepper value={q} max={max} onChange={setQty} label={`Quantity of ${item.name}`} disabled={blocked} />
          <button
            className={`btn btn-buy${added ? ' is-added' : ''}`}
            disabled={blocked}
            onClick={() => {
              addToCart(item.id, q)
              setAdded((n) => n + 1)
            }}
          >
            {blocked ? (
              a.text
            ) : added ? (
              <>
                <Icon name="check" size={16} /> Added to cart
              </>
            ) : (
              'Add to cart'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
