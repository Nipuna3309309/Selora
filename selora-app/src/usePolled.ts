import { useCallback, useEffect, useRef, useState } from 'react'

export interface Polled<T> {
  data: T | undefined
  error: string | undefined
  loading: boolean
  reload: () => Promise<void>
}

/**
 * Loads data and optionally re-loads it on an interval. `intervalMs` may be
 * a function of the latest data so polling can stop at a terminal state.
 */
export function usePolled<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  intervalMs?: number | ((d: T | undefined) => number | null),
): Polled<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    fnRef.current = fn
  })

  const reload = useCallback(async () => {
    try {
      setData(await fnRef.current())
      setError(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const depKey = JSON.stringify(deps.map((d) => (typeof d === 'object' ? '' : d)))

  useEffect(() => {
    void reload()
  }, [reload, depKey, tick])

  useEffect(() => {
    const ms = typeof intervalMs === 'function' ? intervalMs(data) : intervalMs
    if (!ms) return
    const id = setTimeout(() => setTick((t) => t + 1), ms)
    return () => clearTimeout(id)
  }, [data, intervalMs, tick])

  return { data, error, loading, reload }
}
