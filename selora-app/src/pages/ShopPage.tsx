import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { Photo } from '../components/Photo'
import { ProductSheet } from '../components/ProductSheet'
import { availability } from '../domain/availability'
import { formatLkr } from '../domain/format'
import { COLOURS, type Clothing } from '../domain/types'
import { addToCart } from '../cart'
import { useApp } from '../context'
import { prefersReducedMotion } from '../motion'
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
  // Up to 6 different photos from items on sale, shown in turn behind the banner.
  const heroPhotos = useMemo(
    () => Array.from(new Set((data ?? []).filter((c) => c.isActive && c.photoUrl).map((c) => c.photoUrl))).slice(0, 6),
    [data],
  )
  const filtering = search.trim() !== '' || category !== 'All'

  return (
    <section aria-labelledby="shop-title">
      <div className={`shop-hero${heroPhotos.length ? '' : ' shop-hero-plain'}`}>
        {heroPhotos.length > 0 && <HeroSlides urls={heroPhotos} />}
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

const SLIDE_MS = 6000

/** The banner's background photos, cross-fading every few seconds. Paused for reduced motion. */
function HeroSlides({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const current = index % urls.length

  useEffect(() => {
    if (paused || urls.length < 2) return
    const t = setInterval(() => setIndex((n) => (n + 1) % urls.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [paused, urls.length])

  return (
    <>
      <div className="shop-hero-photo" aria-hidden="true">
        {urls.map((url, n) => (
          <div key={url} className={`hero-slide${n === current ? ' is-active' : ''}`}>
            <Photo url={url} alt="" />
          </div>
        ))}
      </div>
      {urls.length > 1 && (
        <div className="hero-controls">
          {urls.map((url, n) => (
            <button
              key={url}
              type="button"
              className="hero-dot"
              aria-label={`Show photo ${n + 1} of ${urls.length}`}
              aria-current={n === current ? 'true' : undefined}
              onClick={() => setIndex(n)}
            />
          ))}
          <button
            type="button"
            className="hero-pause"
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            onClick={() => setPaused((p) => !p)}
          >
            <Icon name={paused ? 'play' : 'pause'} size={16} />
          </button>
        </div>
      )}
    </>
  )
}
