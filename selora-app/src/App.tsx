import { useEffect, useMemo, useState } from 'react'
import { getContext } from '@microsoft/power-apps/app'
import { AppContext } from './context'
import { DATA_MODE, DEMO_FLOW_DELAY_MS } from './config'
import { DemoShopService } from './demo/DemoShopService'
import { FlowSimulator } from './demo/flowSimulator'
import { DEMO_USERS, loadDb, resetDb, saveDb, type DemoDb } from './demo/store'
import { createGateway } from './live/gateway'
import { LiveShopService } from './live/LiveShopService'
import { AdminPage } from './pages/AdminPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { ShopPage } from './pages/ShopPage'
import type { ShopService } from './services/ShopService'
import { usePolled } from './usePolled'

type Page = 'shop' | 'orders' | 'notifications' | 'admin'

export default function App() {
  return DATA_MODE === 'demo' ? <DemoApp /> : <LiveApp />
}

function DemoApp() {
  const [state, setState] = useState(() => {
    const db = loadDb()
    const persist = () => saveDb(db)
    const flow = new FlowSimulator(db, { delayMs: DEMO_FLOW_DELAY_MS, onChange: persist })
    // Orders left pending by a reload are picked up again, like a trigger would.
    db.orders.filter((o) => o.status === 'Pending').forEach((o) => void flow.enqueue(o.id))
    return { db, flow, persist }
  })
  const [userIdx, setUserIdx] = useState(0)
  const [resets, setResets] = useState(0)
  const service = useMemo(
    () => new DemoShopService(state.db, state.flow, DEMO_USERS[userIdx], state.persist),
    [state, userIdx],
  )

  function reset() {
    const db: DemoDb = resetDb()
    const persist = () => saveDb(db)
    setResets((n) => n + 1)
    setState({ db, flow: new FlowSimulator(db, { delayMs: DEMO_FLOW_DELAY_MS, onChange: persist }), persist })
  }

  return (
    <>
      <div className="banner banner-demo">
        <strong>DEMO MODE</strong> · sample data stored in this browser only. Test user:
        <select aria-label="Demo test user" value={userIdx} onChange={(e) => setUserIdx(Number(e.target.value))}>
          {DEMO_USERS.map((u, i) => (
            <option key={u.email} value={i}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
        <button onClick={reset}>Reset demo data</button>
        <span className="muted"> Role switching is disabled in connected mode.</span>
      </div>
      {/* Remount on user switch/reset so every page reloads its data. */}
      <Shell key={`${userIdx}-${resets}`} service={service} mode="demo" />
    </>
  )
}

function LiveApp() {
  const [service, setService] = useState<ShopService>()
  const [error, setError] = useState<string>()
  useEffect(() => {
    void (async () => {
      try {
        const ctx = await getContext()
        const gw = await createGateway()
        setService(await LiveShopService.create(gw, ctx.user.fullName ?? ''))
      } catch (e) {
        // No fallback to demo data: show the failure instead.
        setError(e instanceof Error ? e.message : String(e))
      }
    })()
  }, [])
  if (error) {
    return (
      <main className="center">
        <h1>Selora can't connect</h1>
        <p className="error" role="alert">{error}</p>
        <p className="muted">Connected mode never shows demo data. Fix the connection and reload.</p>
      </main>
    )
  }
  if (!service) return <main className="center"><p className="muted">Connecting…</p></main>
  return <Shell service={service} mode="live" />
}

function Shell({ service, mode }: { service: ShopService; mode: 'demo' | 'live' }) {
  const user = service.currentUser()
  const [page, setPage] = useState<Page>('shop')
  const [unreadTick, setUnreadTick] = useState(0)
  const notes = usePolled(() => service.listMyNotifications(), [service, unreadTick], 4000)
  const unread = (notes.data ?? []).filter((n) => !n.isRead).length
  const current = page === 'admin' && user.role !== 'Admin' ? 'shop' : page

  const nav = (p: Page, label: string, badge?: number) => (
    <button className={current === p ? 'nav on' : 'nav'} onClick={() => setPage(p)}>
      {label}
      {badge ? <span className="badge" aria-label={`${badge} unread`}>{badge}</span> : null}
    </button>
  )

  return (
    <AppContext.Provider value={{ service, mode }}>
      <header className="top">
        <h1>Selora</h1>
        <nav>
          {nav('shop', 'Shop')}
          {nav('orders', 'My Orders')}
          {nav('notifications', 'Notifications', unread)}
          {user.role === 'Admin' && nav('admin', 'Admin')}
        </nav>
        <span className="who">
          {user.name} · {user.role}
        </span>
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
