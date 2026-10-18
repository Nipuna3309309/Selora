import { useEffect, useState } from 'react'
import { useApp } from '../context'
import { saveImage } from '../photoFile'
import { Icon } from './Icon'

/**
 * Shows a clothing photo. Photos in the SharePoint library are loaded through the app's
 * connection (so they work for every signed-in shopper); other links load directly.
 */
export function Photo({ url, alt, saveAs }: { url: string; alt: string; saveAs?: string }) {
  const { service } = useApp()
  const [loaded, setLoaded] = useState<{ url: string; src?: string; failed?: boolean }>()

  useEffect(() => {
    let live = true
    service.photoSrc(url).then(
      (src) => live && setLoaded({ url, src }),
      () => live && setLoaded({ url, failed: true }),
    )
    return () => {
      live = false
    }
  }, [service, url])

  const current = loaded?.url === url ? loaded : undefined
  if (current?.failed) return <div className="photo-empty">Photo unavailable</div>
  if (!current?.src) return <div className="photo-loading" aria-label="Loading photo" />
  return (
    <>
      <img
        src={current.src}
        alt={alt}
        loading="lazy"
        onError={() => setLoaded({ url, failed: true })}
      />
      {saveAs && (
        <button
          type="button"
          className="save-photo"
          aria-label={`Save image of ${saveAs}`}
          title="Save image"
          onClick={() => saveImage(current.src!, saveAs)}
        >
          <Icon name="download" size={18} />
        </button>
      )}
    </>
  )
}
