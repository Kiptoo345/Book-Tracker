import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LOCATIONS } from '../constants'

function EditBook({ books, setBooks, people }) {
  const { id } = useParams() // the ":id" part of /book/:id (always a string)
  const navigate = useNavigate()

  // undefined = "not changed yet" (same idea as your old selectedHolder)
  const [holderChoice, setHolderChoice] = useState(undefined)
  const [locationChoice, setLocationChoice] = useState(undefined)

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
    // Nothing changed, just go back
    if (holderChoice === undefined && locationChoice === undefined) {
      navigate('/')
      return
    }

    const updates = { last_updated: new Date().toISOString() }

    if (holderChoice !== undefined) {
      updates.current_holder_id = holderChoice === '' ? null : holderChoice
    }
    if (locationChoice !== undefined) {
      updates.current_location = locationChoice === '' ? null : locationChoice
    }

    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', book.id)
      .select() // get the saved row back from the database

    if (error) {
      console.error(error)
      return
    }

    // Swap in the fresh row from the database
    setBooks(prev => prev.map(b => (b.id === book.id ? data[0] : b)))
    navigate('/')
  }

  async function handleDelete() {
    if (!window.confirm('Delete this book? This cannot be undone.')) return

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', book.id)

    if (error) {
      console.error(error)
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
          Holder
          <select
            value={holderChoice ?? book.current_holder_id ?? ''}
            onChange={(e) => setHolderChoice(e.target.value)}
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
          >
            <option value="">No location</option>
            {LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </label>

        <button onClick={handleSave}>Save changes</button>
        <button className="delete-btn" onClick={handleDelete}>Delete book</button>
      </div>

      <Link to="/">← Back to list</Link>
    </>
  )
}

export default EditBook