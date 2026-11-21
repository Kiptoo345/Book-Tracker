import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LOCATIONS, CATEGORIES } from '../constants'

function EditBook({ books, setBooks, people }) {
  const { id } = useParams() // the ":id" part of /book/:id (always a string)
  const navigate = useNavigate()

  // undefined = "not changed yet"
  const [holderChoice, setHolderChoice] = useState(undefined)
  const [locationChoice, setLocationChoice] = useState(undefined)
  const [categoryChoice, setCategoryChoice] = useState(undefined)
  const [busy, setBusy] = useState('')         // '' | 'saving' | 'deleting'
  const [errorMsg, setErrorMsg] = useState('')

  const book = books.find(b => String(b.id) === id)

  // Hooks must all run BEFORE any early return
  if (books.length === 0) return <p>Loading…</p>

  if (!book) {
    return (
      <>
        <p>Book not found.</p>
        <Link to="/">← Back to list</Link>
      </>
    )
  }

  async function handleSave() {
    if (busy) return // something is already running

    // Nothing changed, just go back
    if (
      holderChoice === undefined &&
      locationChoice === undefined &&
      categoryChoice === undefined
    ) {
      navigate('/')
      return
    }

    const updates = {}

    if (holderChoice !== undefined) {
      updates.current_holder_id = holderChoice === '' ? null : holderChoice
    }
    if (locationChoice !== undefined) {
      updates.current_location = locationChoice === '' ? null : locationChoice
    }
    if (categoryChoice !== undefined) {
      updates.category = categoryChoice === '' ? null : categoryChoice
    }

    // "Last updated" means "last moved", so only bump it when the
    // holder or location changed (not for a category fix)
    if (holderChoice !== undefined || locationChoice !== undefined) {
      updates.last_updated = new Date().toISOString()
    }

    setBusy('saving')
    setErrorMsg('')

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select()

    if (error) {
      console.error(error)
      setErrorMsg("Couldn't save your changes. Check your connection and try again.")
      setBusy('')
      return
    }

    setBooks(prev => prev.map(b => (b.id === book.id ? data[0] : b)))
    navigate('/')
  }

  async function handleDelete() {
    if (busy) return
    if (!window.confirm('Delete this book? This cannot be undone.')) return

    setBusy('deleting')
    setErrorMsg('')

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', book.id)

    if (error) {
      console.error(error)
      setErrorMsg("Couldn't delete the book. Check your connection and try again.")
      setBusy('')
      return
    }

    setBooks(prev => prev.filter(b => b.id !== book.id))
    navigate('/')
  }

  return (
    <>
      <h2>{book.title}</h2>
      <p>{book.author}</p>

      <div className="stacked-form">
        <label>
          Category
          <select
            value={categoryChoice ?? book.category ?? ''}
            onChange={(e) => setCategoryChoice(e.target.value)}
            disabled={busy !== ''}
          >
            <option value="">No category</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label>
          Holder
          <select
            value={holderChoice ?? book.current_holder_id ?? ''}
            onChange={(e) => setHolderChoice(e.target.value)}
            disabled={busy !== ''}
          >
            <option value="">No holder</option>
            {people.map(person => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>

        <label>
          Location
          <select
            value={locationChoice ?? book.current_location ?? ''}
            onChange={(e) => setLocationChoice(e.target.value)}
            disabled={busy !== ''}
          >
            <option value="">No location</option>
            {LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </label>

        {errorMsg && <p className="error-msg" role="alert">{errorMsg}</p>}

        <button onClick={handleSave} disabled={busy !== ''}>
          {busy === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        <button className="delete-btn" onClick={handleDelete} disabled={busy !== ''}>
          {busy === 'deleting' ? 'Deleting…' : 'Delete book'}
        </button>
      </div>

      <Link to="/">← Back to list</Link>
    </>
  )
}

export default EditBook