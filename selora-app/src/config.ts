/** `demo` (default) uses local sample data. `live` uses SharePoint and never falls back to demo. */
export const DATA_MODE: 'demo' | 'live' = import.meta.env.VITE_DATA_MODE === 'live' ? 'live' : 'demo'

/** Simulated flow processing time in demo mode, so "pending" states are visible. */
export const DEMO_FLOW_DELAY_MS = 1500
