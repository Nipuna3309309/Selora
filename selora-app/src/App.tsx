import { useEffect, useState, useSyncExternalStore } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import { setAppearance, useAppearance, type Appearance } from './appearance'
import { CartSheet } from './components/CartSheet'
import { Icon, type IconName } from './components/Icon'
import { initCart, useCart } from './cart'
import { AppContext } from './context'
import { createGateway } from './live/gateway'
import { LiveShopService } from './live/LiveShopService'
import type { AdminSection } from './domain/dashboard'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { ShopPage } from './pages/ShopPage'
import type { ShopService } from './services/ShopService'
import { transition } from './motion'
import { usePolled } from './usePolled'

type Page = 'shop' | 'orders' | 'notifications' | 'dashboard' | AdminSection

const SHOP_LINKS: { page: Page; label: string; icon: IconName }[] = [
  { page: 'shop', label: 'Shop', icon: 'shirt' },
  { page: 'orders', label: 'My orders', icon: 'receipt' },
  { page: 'notifications', label: 'Notifications', icon: 'bell' },
]
const ADMIN_LINKS: { page: Page; label: string; icon: IconName }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { page: 'clothes', label: 'Clothes', icon: 'tag' },
  { page: 'costs', label: 'Buying costs', icon: 'coins' },
  { page: 'all-orders', label: 'All orders', icon: 'list' },
  { page: 'sales', label: 'Sales', icon: 'chart' },
  { page: 'suppliers', label: 'Suppliers', icon: 'truck' },
]
const ADMIN_PAGES = new Set<Page>(ADMIN_LINKS.map((l) => l.page))

const narrowQuery = window.matchMedia('(max-width: 1199px)')
/** True while the sidebar is a slide-in drawer rather than a fixed column. */
function useNarrow(): boolean {
  return useSyncExternalStore(
    (cb) => {
      narrowQuery.addEventListener('change', cb)
      return () => narrowQuery.removeEventListener('change', cb)
    },
    () => narrowQuery.matches,
  )
}

function Wordmark() {
  return (
    <div className="wordmark" aria-label="Selora">
      <span aria-hidden="true">Selora</span>
      <svg className="thread" viewBox="0 0 96 10" aria-hidden="true" focusable="false">
        <path d="M1 6 C 22 0, 40 10, 62 5 S 88 3, 95 5" />
      </svg>
    </div>
  )
}

function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button className="icon-btn cart-btn" onClick={onClick} aria-label={count ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart'}>
      <Icon name="cart" />
      {count > 0 && (
        <span className="cart-count" key={count} aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  )
}

const APPEARANCES: { id: Appearance; label: string; icon: IconName }[] = [
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'auto', label: 'Auto', icon: 'monitor' },
]

function AppearanceSwitch() {
  const mode = useAppearance()
  return (
    <div className="mode-switch" role="radiogroup" aria-label="Appearance">
      {APPEARANCES.map((a) => (
        <button key={a.id} role="radio" aria-checked={mode === a.id} onClick={() => setAppearance(a.id)}>
          <Icon name={a.icon} size={16} />
          {a.label}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [service, setService] = useState<ShopService>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    void (async () => {
      try {
        const ctx = await getContext()
        const gw = createGateway()
        const live = await LiveShopService.create(gw, ctx.user.fullName ?? '')
        initCart(live.currentUser().email)
        setService(live)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [])
  if (error) {
    return (
      <main className="center">
        <Wordmark />
        <h1>Selora can't connect</h1>
        <p className="notice notice-bad" role="alert">{error}</p>
        <p className="muted">Check that you have access to the Selora SharePoint lists, then reload this page.</p>
      </main>
    )
  }
  if (!service) {
    return (
      <main className="center" aria-busy="true">
        <Wordmark />
        <p className="muted">Connecting to the shop…</p>
      </main>
    )
  }
  return <Shell service={service} />
}

function Shell({ service }: { service: ShopService }) {
  const user = service.currentUser()
  const admin = user.role === 'Admin'
  const narrow = useNarrow()
  const [page, setPage] = useState<Page>(admin ? 'dashboard' : 'shop')
  const [drawer, setDrawer] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = useCart().reduce((n, l) => n + l.quantity, 0)
  const [unreadTick, setUnreadTick] = useState(0)
  const notes = usePolled(() => service.listMyNotifications(), [service, unreadTick], 4000)
  const unread = (notes.data ?? []).filter((n) => !n.isRead).length
  const current = ADMIN_PAGES.has(page) && !admin ? 'shop' : page
  const open = narrow && drawer

  const go = (p: Page) => {
    setDrawer(false)
    if (p !== current) transition(() => setPage(p))
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const link = (l: { page: Page; label: string; icon: IconName }, badge?: number) => (
    <li key={l.page}>
      <button className="side-link" aria-current={current === l.page ? 'page' : undefined} onClick={() => go(l.page)}>
        {current === l.page && <span className="side-pill" aria-hidden="true" />}
        <Icon name={l.icon} />
        <span>{l.label}</span>
        {badge ? (
          <span className="badge" key={badge}>
            {badge}
            <span className="sr-only"> unread</span>
          </span>
        ) : null}
      </button>
    </li>
  )

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <AppContext.Provider value={{ service }}>
      <div className="layout">
        <aside
          id="sidebar"
          className={`sidebar${open ? ' open' : ''}`}
          aria-label="Main navigation"
          inert={narrow && !drawer}
        >
          <Wordmark />
          <nav>
            <p className="side-label">Shop</p>
            <ul>{SHOP_LINKS.map((l) => link(l, l.page === 'notifications' ? unread : undefined))}</ul>
            {admin && (
              <>
                <p className="side-label">Manage</p>
                <ul>{ADMIN_LINKS.map((l) => link(l))}</ul>
              </>
            )}
          </nav>
          <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
          <AppearanceSwitch />
          <div className="side-user">
            <span className="avatar" aria-hidden="true">{initials}</span>
            <span>
              <strong>{user.name}</strong>
              <span className="muted small">{user.role}</span>
            </span>
          </div>
        </aside>
        {open && <div className="side-scrim" onClick={() => setDrawer(false)} />}

        <div className="content">
          <header className="topbar">
            <button
              className="icon-btn"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="sidebar"
              onClick={() => setDrawer(true)}
            >
              <Icon name="menu" />
              {unread > 0 && <span className="menu-dot" aria-hidden="true" />}
            </button>
            <Wordmark />
            <CartButton count={cartCount} onClick={() => setCartOpen(true)} />
          </header>
          <main className="page" key={current}>
            {current === 'shop' && <ShopPage />}
            {current === 'orders' && <OrdersPage />}
            {current === 'notifications' && <NotificationsPage onChanged={() => setUnreadTick((t) => t + 1)} />}
            {current === 'dashboard' && <DashboardPage onGo={go} />}
            {current !== 'dashboard' && ADMIN_PAGES.has(current) && <AdminPage section={current as AdminSection} />}
          </main>
        </div>
      </div>
      {cartOpen && (
        <CartSheet
          onClose={() => setCartOpen(false)}
          onPlaced={() => {
            setCartOpen(false)
            go('orders')
          }}
        />
      )}
    </AppContext.Provider>
  )
}
