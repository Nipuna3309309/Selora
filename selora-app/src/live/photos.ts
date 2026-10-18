import { SITE_URL } from './columns'

const site = new URL(SITE_URL)

/**
 * The link stored in Clothes.PhotoUrl for an uploaded file. It is a real, clickable
 * SharePoint address, whether the connector returned a site-relative or a server-relative path.
 */
export function photoUrlFor(path: string): string {
  const serverRelative = path.startsWith(site.pathname) ? path : `${site.pathname}${path}`
  return `${site.origin}${encodeURI(serverRelative)}`
}

/** The site-relative path of a photo stored on our site, or null for any other link. */
export function libraryPathOf(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.origin !== site.origin) return null
  const path = decodeURI(parsed.pathname)
  return path.toLowerCase().startsWith(`${site.pathname.toLowerCase()}/`) ? path.slice(site.pathname.length) : null
}

function base64ToBlob(base64: string, type: string): Blob {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

/**
 * File content from the connector as a Blob. The host can hand binary content back as
 * a Blob, bytes, base64, a data URL or a `{ $content-type, $content }` envelope.
 */
export function contentToBlob(data: unknown, fallbackType = 'image/jpeg'): Blob {
  if (data instanceof Blob) return data
  if (data instanceof ArrayBuffer) return new Blob([data], { type: fallbackType })
  if (data instanceof Uint8Array) return new Blob([new Uint8Array(data)], { type: fallbackType })
  if (typeof data === 'string') {
    const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(data)
    if (m) return m[2] ? base64ToBlob(m[3], m[1] ?? fallbackType) : new Blob([decodeURIComponent(m[3])], { type: m[1] })
    return base64ToBlob(data.replace(/\s/g, ''), fallbackType)
  }
  if (data && typeof data === 'object' && '$content' in data) {
    const env = data as { $content: string; '$content-type'?: string }
    return base64ToBlob(env.$content, env['$content-type'] ?? fallbackType)
  }
  throw new Error('The photo came back in a format the app does not recognise.')
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the photo.'))
    reader.readAsDataURL(blob)
  })
}
