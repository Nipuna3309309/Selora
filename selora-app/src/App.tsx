import { useEffect, useState } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import { Icon, type IconName } from './components/Icon'
import { AppContext } from './context'
import { createGateway } from './live/gateway'
import { LiveShopService } from './live/LiveShopService'
import { AdminPage } from './pages/AdminPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { ShopPage } from './pages/ShopPage'
import type { ShopService } from './services/ShopService'
import { usePolled } from './usePolled'

type Page = 'shop' | 'orders' | 'notifications' | 'admin'

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

export default function App() {
  const [service, setService] = useState<ShopService>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    void (async () => {
      try {
        const ctx = await getContext()
        const gw = createGateway()
        setService(await LiveShopService.create(gw, ctx.user.fullName ?? ''))
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
  const [page, setPage] = useState<Page>('shop')
  const [unreadTick, setUnreadTick] = useState(0)
  const notes = usePolled(() => service.listMyNotifications(), [service, unreadTick], 4000)
  const unread = (notes.data ?? []).filter((n) => !n.isRead).length
  const current = page === 'admin' && user.role !== 'Admin' ? 'shop' : page

  const tab = (p: Page, label: string, icon: IconName, badge?: number) => (
    <button
      key={p}
      className="tab"
      aria-current={current === p ? 'page' : undefined}
      onClick={() => setPage(p)}
    >
      <Icon name={icon} />
      <span>{label}</span>
      {badge ? (
        <span className="badge">
          {badge}
          <span className="sr-only"> unread</span>
        </span>
      ) : null}
    </button>
  )

  return (
    <AppContext.Provider value={{ service }}>
      <header className="top">
        <Wordmark />
        <nav aria-label="Main">
          {tab('shop', 'Shop', 'shirt')}
          {tab('orders', 'My orders', 'receipt')}
          {tab('notifications', 'Notifications', 'bell', unread)}
          {user.role === 'Admin' && tab('admin', 'Admin', 'gauge')}
        </nav>
        <p className="who">
          <span>{user.name}</span>
          <span className="role">{user.role}</span>
        </p>
      </header>
      <main>
        {current === 'shop' && <ShopPage onOrdered={() => setPage('orders')} />}
        {current === 'orders' && <OrdersPage />}
        {current === 'notifications' && <NotificationsPage onChanged={() => setUnreadTick((t) => t + 1)} />}
        {current === 'admin' && <AdminPage />}
      </main>
    </AppContext.Provider>
  )
}
