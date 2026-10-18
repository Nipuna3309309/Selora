import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion'

/** Rolls a number from its previous value to the new one, so changes in totals are easy to notice. */
export function CountUp({ value, format, ms = 900 }: { value: number; format: (n: number) => string; ms?: number }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = value
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    const start = performance.now()
    const begin = from.current
    let id = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      const n = begin + (value - begin) * eased
      from.current = n
      setShown(t === 1 ? value : Math.round(n))
      if (t < 1) id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [value, ms])

  return (
    <>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
