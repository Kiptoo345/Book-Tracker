import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { LOCATIONS } from '../constants'

function AddBook({ setBooks, people, me }) {
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newHolder, setNewHolder] = useState(null)
  const [newLocation, setNewLocation] = useState('')
  const navigate = useNavigate()

  // Holder defaults to whoever is logged in
  const formHolder = newHolder ?? me?.id ?? ''

  async function handleAddBook(e) {
    e.preventDefault()

    if (newTitle.trim() === '') return

    const { data, error } = await supabase
      .from('books')
      .insert({
        title: newTitle.trim(),
        author: newAuthor.trim(),
        current_holder_id: formHolder === '' ? null : formHolder,
        current_location: newLocation === '' ? null : newLocation,
        last_updated: new Date().toISOString(), // so new books show a date
      })
      .select()

    if (error) {
      console.error(error)
      return
    }

    setBooks(prev => [...prev, ...data])
    navigate('/') // back to the list
  }

  return (
    <>
      <h2>Add a book</h2>

      <form className="stacked-form" onSubmit={handleAddBook}>
        <label>
          Title
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </label>

        <label>
          Author
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
          />
        </label>

        <label>
          Holder
          <select value={formHolder} onChange={(e) => setNewHolder(e.target.value)}>
            <option value="">No holder</option>
            {people.map(person => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>

        <label>
          Location
          <select value={newLocation} onChange={(e) => setNewLocation(e.target.value)}>
            <option value="">No location</option>
            {LOCATIONS.map(loc => (
              <option key={loc.value} value={loc.value}>{loc.label}</option>
            ))}
          </select>
        </label>

        <button type="submit">Add book</button>
      </form>

      <Link to="/">← Back to list</Link>
    </>
  )
}

export default AddBook