import { createContext, useContext } from 'react'
import type { ShopService } from './services/ShopService'

export interface AppCtx {
  service: ShopService
}

export const AppContext = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const v = useContext(AppContext)
  if (!v) throw new Error('AppContext missing')
  return v
}
