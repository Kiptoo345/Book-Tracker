import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LOCATIONS } from '../constants'

// "2026-11-18T09:56:00Z" → "18 Nov 2026" how it is shown
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function BookList({ books, people, me }) {
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [holderFilter, setHolderFilter] = useState('')
  const navigate = useNavigate()

  // The book only stores ids, so look up the readable names
  function holderName(id) {
    return people.find(p => p.id === id)?.name ?? '—'
  }

  function locationLabel(value) {
    return LOCATIONS.find(l => l.value === value)?.label ?? '—'
  }

  const filteredBooks = books.filter(book => {
    const text = search.trim().toLowerCase()

    const matchesSearch =
      (book.title ?? '').toLowerCase().includes(text) ||
      (book.author ?? '').toLowerCase().includes(text)

    const matchesLocation =
      locationFilter === '' || book.current_location === locationFilter

    const matchesHolder =
      holderFilter === '' ||
      (holderFilter === 'me' && me && book.current_holder_id === me.id) ||
      (holderFilter === 'none' && book.current_holder_id == null) ||
      String(book.current_holder_id) === holderFilter

    return matchesSearch && matchesLocation && matchesHolder
  })

  return (
    <>
      <h1>Home Book-Tracker</h1>
      <h2>Keeps a record of our books and where each one is.</h2>

      <Link to="/add" className="add-book-btn">+ Add book</Link>

      <div className="filters">
        <input
          type="text"
          placeholder="Search title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {LOCATIONS.map(loc => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>

        <select value={holderFilter} onChange={(e) => setHolderFilter(e.target.value)}>
          <option value="">All holders</option>
          {me && <option value="me">My books</option>}
          <option value="none">No holder</option>
          {people.map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
      </div>

      <table className="book-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Holder</th>
            <th>Location</th>
            <th>Last updated</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map(book => (
            <tr
              key={book.id}
              className="clickable"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <td data-label="Title">{book.title}</td>
              <td data-label="Author">{book.author}</td>
              <td data-label="Holder">{holderName(book.current_holder_id)}</td>
              <td data-label="Location">{locationLabel(book.current_location)}</td>
              <td data-label="Last updated">{formatDate(book.last_updated)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredBooks.length === 0 && <p>No books found.</p>}
    </>
  )
}

export default BookList