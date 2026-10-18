import { useState } from 'react'
import { SITE_URL } from '../live/columns'

/**
 * The signed-in person's Microsoft 365 profile photo, read from their SharePoint profile.
 * Falls back to initials when there is no photo or the browser can't load it.
 */
export function Avatar({ email, name }: { email: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const src = `${SITE_URL}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(email)}`

  return (
    <span className="avatar" aria-hidden="true">
      {initials}
      {!failed && email && (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            // SharePoint returns a tiny placeholder for people without a photo; keep the initials then.
            if (e.currentTarget.naturalWidth < 8) setFailed(true)
          }}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}
