const MAX_SIDE = 1600
const MAX_INPUT_BYTES = 20 * 1024 * 1024

/**
 * Turns a picked photo into a JPEG no larger than 1600px on its longest side, so uploads stay
 * small and quick on a phone connection. Transparent areas become white.
 */
export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG or WebP).')
  if (file.size > MAX_INPUT_BYTES) throw new Error('That photo is larger than 20 MB. Choose a smaller one.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('This image could not be read. Try a JPG or PNG.')
  })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The photo could not be prepared.'))), 'image/jpeg', 0.86),
  )
}

/** Downloads an image the page can already show (an object URL or a link). */
export function saveImage(src: string, name: string) {
  const a = document.createElement('a')
  a.href = src
  a.download = `${name.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '') || 'photo'}.jpg`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
