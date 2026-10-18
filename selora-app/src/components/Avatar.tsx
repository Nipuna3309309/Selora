import { useRef, useState } from 'react'
import { SITE_URL } from '../live/columns'

const SIZE = 160
const key = (email: string) => `selora-avatar:${email.toLowerCase()}`

function stored(email: string): string | null {
  try {
    return localStorage.getItem(key(email))
  } catch {
    return null
  }
}

/** Crops the picture to a centred square and shrinks it, so it stays small enough to keep in the browser. */
async function toSquare(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * The signed-in person's picture. With `editable`, clicking it lets them choose their own photo,
 * kept in this browser. Otherwise it is their Microsoft 365 profile photo from SharePoint, and it
 * falls back to initials when there is none or the browser can't load it.
 */
export function Avatar({ email, name, editable = false }: { email: string; name: string; editable?: boolean }) {
  const [failed, setFailed] = useState(false)
  const [own, setOwn] = useState(() => stored(email))
  const [problem, setProblem] = useState<string>()
  const input = useRef<HTMLInputElement>(null)
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const src = `${SITE_URL}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(email)}`

  async function pick(file: File | undefined) {
    if (!file) return
    setProblem(undefined)
    try {
      const url = await toSquare(file)
      localStorage.setItem(key(email), url)
      setOwn(url)
    } catch {
      setProblem("That picture couldn't be used. Try a JPG or PNG.")
    }
  }

  const picture = (
    <>
      {initials}
      {own ? (
        <img src={own} alt="" />
      ) : (
        !failed &&
        email && (
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
        )
      )}
    </>
  )

  if (!editable)
    return (
      <span className="avatar" aria-hidden="true">
        {picture}
      </span>
    )

  return (
    <>
      <button
        type="button"
        className="avatar avatar-edit"
        onClick={() => input.current?.click()}
        aria-label="Change your profile picture"
        title={problem ?? 'Change your profile picture'}
      >
        {picture}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </>
  )
}
