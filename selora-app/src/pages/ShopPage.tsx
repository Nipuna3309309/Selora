import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { ProductSheet } from '../components/ProductSheet'
import { availability } from '../domain/availability'
import { formatLkr } from '../domain/format'
import { COLOURS, type Clothing } from '../domain/types'
import { addToCart } from '../cart'
import { useApp } from '../context'
import { usePolled } from '../usePolled'

export function ShopPage() {
  const { service } = useApp()
  const { data, error, loading, reload } = usePolled(() => service.listClothes(), [service], 15000)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [openId, setOpenId] = useState<string>()

  const categories = useMemo(
    () => ['All', ...Array.from(new Set((data ?? []).map((c) => c.category).filter(Boolean))).sort()],
    [data],
  )
  const shown = (data ?? []).filter(
    (c) =>
      (category === 'All' || c.category === category) &&
      `${c.name} ${c.colour} ${c.size} ${c.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const heroPhoto = (data ?? []).find((c) => c.photoUrl)?.photoUrl
  const filtering = search.trim() !== '' || category !== 'All'

  return (
    <section aria-labelledby="shop-title">
      <div className={`shop-hero${heroPhoto ? '' : ' shop-hero-plain'}`}>
        {heroPhoto && (
          <div className="shop-hero-photo" aria-hidden="true">
            <Photo url={heroPhoto} alt="" />
          </div>
        )}
        <div>
          <h1>Made to move</h1>
          <p>Explore the collection</p>
          <button className="btn" onClick={() => document.getElementById('shop-title')?.scrollIntoView({ behavior: 'smooth' })}>
            Shop all
          </button>
        </div>
      </div>

      <div className="page-head">
        <h2 id="shop-title">Shop the latest styles</h2>
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
            <div key={i} className="tile tile-skel" style={{ '--i': i } as CSSProperties} aria-hidden="true" />
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
        {shown.map((c, i) => (
          <Tile key={c.id} item={c} index={i} onOpen={() => setOpenId(c.id)} />
        ))}
      </div>

      {openId && shown.some((c) => c.id === openId) && (
        <ProductSheet items={shown} id={openId} onChange={setOpenId} onClose={() => setOpenId(undefined)} />
      )}
    </section>
  )
}

function Tile({ item, index, onOpen }: { item: Clothing; index: number; onOpen: () => void }) {
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1400)
    return () => clearTimeout(t)
  }, [added])
  const a = availability(item)
  const blocked = a.kind === 'out' || a.kind === 'off'
  const swatch = COLOURS.find((c) => c.name.toLowerCase() === item.colour.trim().toLowerCase())
  return (
    <article className={`tile${blocked ? ' tile-off' : ''}`} style={{ '--i': Math.min(index, 12) } as CSSProperties}>
      <div className="photo">
        {item.photoUrl ? (
          <Photo url={item.photoUrl} alt={item.name} saveAs={item.name} />
        ) : (
          <div className="photo-empty">No photo</div>
        )}
        <button className="photo-open" onClick={onOpen} aria-label={`View ${item.name}`} />
        {item.size && (
          <span className="size-tag" aria-label={`Size ${item.size}`}>
            {item.size}
          </span>
        )}
        {blocked ? (
          <span className="sold-band">{a.text}</span>
        ) : (
          <button
            className={`quick-add${added ? ' is-added' : ''}`}
            onClick={() => {
              addToCart(item.id, 1)
              setAdded(true)
            }}
          >
            <Icon name={added ? 'check' : 'plus'} size={16} />
            {added ? 'Added' : 'Quick add'}
          </button>
        )}
      </div>
      <div className="tile-info">
        <div className="tile-line">
          <h3>
            <button className="name-link" onClick={onOpen}>
              {item.name}
            </button>
          </h3>
          <p className="price">{formatLkr(item.price)}</p>
        </div>
        <p className="muted tile-sub">
          {swatch && <span className="dot" style={{ '--sw': swatch.hex } as CSSProperties} aria-hidden="true" />}
          {item.colour}
          {item.category ? `, ${item.category}` : ''}
        </p>
        {a.kind === 'low' && <p className="avail avail-low">{a.text}</p>}
      </div>
    </article>
  )
}
