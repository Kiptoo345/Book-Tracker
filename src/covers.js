import { supabase } from './supabaseClient'

// ---------------------------------------------------------------
// Option A: look the cover up on Open Library (free, no API key)
// Returns an image URL, or null if no cover was found.
// ---------------------------------------------------------------
export async function findCoverOnline(title, author) {
  const params = new URLSearchParams({ title, limit: '5', fields: 'cover_i' })
  if (author) params.set('author', author)

  const res = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!res.ok) throw new Error(`Open Library replied ${res.status}`)

  const json = await res.json()
  // first result that actually has a cover image
  const hit = json.docs.find(doc => doc.cover_i)
  return hit ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-M.jpg` : null
}

// ---------------------------------------------------------------
// Option B: a photo taken on the phone, uploaded to Supabase Storage
// ---------------------------------------------------------------

// Phone photos are often 3–5 MB. Shrink to 600px wide (~50–100 KB)
// so the free 1 GB of storage lasts and the list loads fast.
async function shrinkImage(file, maxWidth = 600) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxWidth / bitmap.width)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not read the image'))),
      'image/jpeg',
      0.8,
    )
  })
}

// Returns the public URL of the uploaded photo
export async function uploadCoverPhoto(file) {
  const blob = await shrinkImage(file)
  const path = `${crypto.randomUUID()}.jpg` // random name, never clashes

  const { error } = await supabase.storage
    .from('covers')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error

  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
}
