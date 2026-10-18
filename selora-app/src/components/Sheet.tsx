import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * Dialog that rises from the bottom on phones and sits centred on larger screens.
 * Escape and the backdrop close it, focus is kept inside, and focus returns to
 * the control that opened it. It renders into <body>, so an animated ancestor can't trap it.
 */
export function Sheet({
  title,
  onClose,
  children,
  closeDisabled,
  className = '',
}: {
  className?: string
  title: string
  onClose: () => void
  children: ReactNode
  closeDisabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const lockRef = useRef(closeDisabled)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
    lockRef.current = closeDisabled
  })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const node = ref.current
    const first = node?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? node)?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !lockRef.current) {
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      opener?.focus()
    }
  }, [])

  return createPortal(
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !closeDisabled) onClose()
      }}
    >
      <div className={`sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <header className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} disabled={closeDisabled} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}
