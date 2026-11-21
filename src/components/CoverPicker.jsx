import { useState } from 'react'
import { findCoverOnline, uploadCoverPhoto } from '../covers'

// Shows the current cover and lets the user find one online,
// take/upload a photo, or remove it.
// value    = current cover URL ('' = no cover)
// onChange = called with the new URL ('' to remove)
function CoverPicker({ value, onChange, title, author, disabled }) {
  const [status, setStatus] = useState('')   // '' | 'searching' | 'uploading'
  const [message, setMessage] = useState('')

  const busy = disabled || status !== ''

  async function handleFind() {
    if (busy) return
    if (!title?.trim()) {
      setMessage('Type the title first, then search.')
      return
    }

    setStatus('searching')
    setMessage('')
    try {
      const url = await findCoverOnline(title.trim(), author?.trim())
      if (url) onChange(url)
      else setMessage('No cover found online. You can take a photo instead.')
    } catch (err) {
      console.error(err)
      setMessage("Couldn't search right now. Check your connection.")
    }
    setStatus('')
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = '' // lets the same file be picked again later
    if (!file || busy) return

    setStatus('uploading')
    setMessage('')
    try {
      onChange(await uploadCoverPhoto(file))
    } catch (err) {
      console.error(err)
      setMessage("Couldn't upload the photo. Check your connection and try again.")
    }
    setStatus('')
  }

  return (
    <div className="cover-picker">
      <span className="field-label">Cover</span>

      <div className="cover-row">
        {value ? (
          <img className="cover-preview" src={value} alt="Book cover" />
        ) : (
          <div className="cover-preview empty">📖</div>
        )}

        <div className="cover-actions">
          <button type="button" className="secondary-btn" onClick={handleFind} disabled={busy}>
            {status === 'searching' ? 'Searching…' : 'Find cover online'}
          </button>

          {/* No "capture" attribute: phones then offer camera OR gallery */}
          <label className={busy ? 'secondary-btn file-btn disabled' : 'secondary-btn file-btn'}>
            {status === 'uploading' ? 'Uploading…' : 'Take / upload photo'}
            <input type="file" accept="image/*" onChange={handleFile} disabled={busy} hidden />
          </label>

          {value && (
            <button type="button" className="link-btn" onClick={() => onChange('')} disabled={busy}>
              Remove cover
            </button>
          )}
        </div>
      </div>

      {message && <p className="hint">{message}</p>}
    </div>
  )
}

export default CoverPicker
